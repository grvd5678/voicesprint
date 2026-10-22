import React, { useState, useEffect, useMemo } from 'react';
import { api } from './services/api';
import { useSocket, SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { VoiceModal } from './components/VoiceModal';
import { TaskCreateModal } from './components/TaskCreateModal';
import { TaskDrawer } from './components/TaskDrawer';
import { Mic, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

function AppContent() {
  const { socket, liveNotification, clearNotification } = useSocket();

  // State
  const [tasks, setTasks] = useState([]);
  const [sprint, setSprint] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState('ALL');
  
  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [defaultCreateStatus, setDefaultCreateStatus] = useState('todo');
  const [selectedTask, setSelectedTask] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [activeSprintRes, tasksRes, usersRes] = await Promise.all([
          api.getActiveSprint(),
          api.getTasks(),
          api.getUsers(),
        ]);

        if (activeSprintRes.success) setSprint(activeSprintRes.data);
        if (tasksRes.success) setTasks(tasksRes.data);
        if (usersRes.success) setUsers(usersRes.data);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to connect to backend. Please ensure the server is running on port 5000.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Socket.io Real-Time Event Subscriptions
  useEffect(() => {
    if (!socket) return;

    // Real-time task creation
    socket.on('TASK_CREATED', (newTask) => {
      console.log('⚡ Socket event [TASK_CREATED]:', newTask);
      setTasks((prev) => {
        if (prev.some((t) => t._id === newTask._id)) return prev;
        return [newTask, ...prev];
      });
    });

    // Real-time task update
    socket.on('TASK_UPDATED', (updatedTask) => {
      console.log('⚡ Socket event [TASK_UPDATED]:', updatedTask);
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      setSelectedTask((prev) => (prev?._id === updatedTask._id ? updatedTask : prev));
    });

    // Real-time task deletion
    socket.on('TASK_DELETED', ({ id }) => {
      console.log('⚡ Socket event [TASK_DELETED]:', id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setSelectedTask((prev) => (prev?._id === id ? null : prev));
    });

    // Real-time board reordering
    socket.on('BOARD_REORDERED', (updates) => {
      console.log('⚡ Socket event [BOARD_REORDERED]:', updates);
      setTasks((prev) => {
        const updateMap = new Map(updates.map((u) => [u.id, u]));
        return prev.map((t) => {
          const u = updateMap.get(t._id);
          return u ? { ...t, status: u.status, order: u.order } : t;
        });
      });
    });

    return () => {
      socket.off('TASK_CREATED');
      socket.off('TASK_UPDATED');
      socket.off('TASK_DELETED');
      socket.off('BOARD_REORDERED');
    };
  }, [socket]);

  // Global Keyboard Shortcut: Alt + V opens Voice Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setIsVoiceModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = (task.description || '').toLowerCase().includes(query);
        const matchesTag = (task.labels || []).some((l) => l.toLowerCase().includes(query));
        const matchesAssignee = task.assignee?.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesTag && !matchesAssignee) return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (selectedUser !== 'ALL') {
        if (!task.assignee || task.assignee._id !== selectedUser) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, selectedUser]);

  // Quick Stats
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      p0: tasks.filter((t) => t.priority === 'P0').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  }, [tasks]);

  // Handlers: Move task across columns
  const handleMoveTask = async (taskId, targetColumnId) => {
    const targetTask = tasks.find((t) => t._id === taskId);
    if (!targetTask || targetTask.status === targetColumnId) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: targetColumnId } : t))
    );

    // Confetti celebration if dropped into 'Done'
    if (targetColumnId === 'done') {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.7 },
      });
    }

    try {
      await api.updateTask(taskId, { status: targetColumnId });
    } catch (err) {
      console.error('Failed to move task:', err);
      // Rollback on failure
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: targetTask.status } : t))
      );
    }
  };

  // Handlers: Reorder tasks within column or cross-column with explicit index
  const handleReorderTasks = async (updates) => {
    if (!updates || updates.length === 0) return;

    // Snapshot previous tasks for rollback
    const previousTasks = [...tasks];

    // Optimistic update
    setTasks((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u]));
      return prev.map((t) => {
        const u = updateMap.get(t._id);
        return u ? { ...t, status: u.status, order: u.order } : t;
      });
    });

    try {
      await api.batchUpdatePositions(updates);
    } catch (err) {
      console.error('Failed to persist task reorder, rolling back:', err);
      // Rollback to previous state on network failure
      setTasks(previousTasks);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    await handleMoveTask(taskId, newStatus);
  };

  const handleUpdateAssignee = async (taskId, assigneeId) => {
    try {
      const res = await api.updateTask(taskId, { assignee: assigneeId });
      if (res.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data : t))
        );
        setSelectedTask(res.data);
      }
    } catch (err) {
      console.error('Failed to update assignee:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      if (selectedTask?._id === taskId) setSelectedTask(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // 1-Click direct voice intake
  const handleProcessVoice = async (transcript) => {
    const res = await api.sendVoiceIntake(transcript, sprint?._id);
    if (res.success) {
      setTasks((prev) => {
        if (prev.some((t) => t._id === res.data._id)) return prev;
        return [res.data, ...prev];
      });
    }
  };

  // Save reviewed voice task
  const handleSaveReviewedTask = async (taskData) => {
    const res = await api.createTask(taskData);
    if (res.success) {
      setTasks((prev) => {
        if (prev.some((t) => t._id === res.data._id)) return prev;
        return [res.data, ...prev];
      });
    }
  };

  // Manual task creation
  const handleCreateManualTask = async (taskData) => {
    const res = await api.createTask(taskData);
    if (res.success) {
      setTasks((prev) => {
        if (prev.some((t) => t._id === res.data._id)) return prev;
        return [res.data, ...prev];
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        sprint={sprint}
        stats={stats}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenCreateModal={() => {
          setDefaultCreateStatus('todo');
          setIsCreateModalOpen(true);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        users={users}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
      />

      {/* Main Board Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        
        {/* Live Voice Broadcast Toast */}
        {liveNotification && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 shadow-xl shadow-purple-950/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-purple-600 text-white animate-pulse">
                <Mic className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Voice Ticket Ingested:</span>
                  <span className="text-purple-300 font-semibold">{liveNotification.title}</span>
                </p>
                <p className="text-[11px] text-purple-300/80">
                  Priority: <strong className="text-purple-200">{liveNotification.priority}</strong> • Assigned to: <strong className="text-purple-200">{liveNotification.assignee}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={clearNotification}
              className="text-xs text-purple-300 hover:text-white px-2 py-1 rounded bg-purple-900/40 border border-purple-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Syncing VoiceSprint Board & Sprints...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-center max-w-lg mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">Server Offline</h3>
            <p className="text-xs text-rose-200 mb-4">{error}</p>
            <p className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded">
              Run: cd server && node server.js
            </p>
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            allTasks={tasks}
            isFiltered={Boolean(searchQuery.trim() || priorityFilter !== 'ALL' || selectedUser !== 'ALL')}
            onTaskClick={(task) => setSelectedTask(task)}
            onMoveTask={handleMoveTask}
            onReorderTasks={handleReorderTasks}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenCreateModal={(columnId) => {
              setDefaultCreateStatus(columnId || 'todo');
              setIsCreateModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Voice Ingestion Overlay Modal (With Review/Edit Step) */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onProcessVoice={handleProcessVoice}
        onSaveReviewedTask={handleSaveReviewedTask}
        sprint={sprint}
        users={users}
      />

      {/* Manual Task Creation Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateManualTask}
        defaultStatus={defaultCreateStatus}
        sprint={sprint}
        users={users}
      />

      {/* Task Inspection Drawer */}
      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateAssignee={handleUpdateAssignee}
        onDeleteTask={handleDeleteTask}
        users={users}
      />
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
