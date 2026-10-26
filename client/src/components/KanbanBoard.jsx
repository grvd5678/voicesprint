import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { 
  Inbox, 
  ListTodo, 
  PlayCircle, 
  CheckCircle, 
  Eye, 
  Plus 
} from 'lucide-react';

export const KanbanBoard = ({ 
  tasks,
  allTasks = [],
  isFiltered = false, 
  onTaskClick, 
  onMoveTask,
  onReorderTasks,
  onOpenVoiceModal,
  onOpenCreateModal 
}) => {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    {
      id: 'backlog',
      title: 'Backlog',
      icon: <Inbox className="w-4 h-4 text-slate-400" />,
      accent: 'border-slate-700/60',
      badge: 'bg-slate-800 text-slate-400',
    },
    {
      id: 'todo',
      title: 'To Do',
      icon: <ListTodo className="w-4 h-4 text-sky-400" />,
      accent: 'border-sky-500/40',
      badge: 'bg-sky-500/20 text-sky-300',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: <PlayCircle className="w-4 h-4 text-indigo-400" />,
      accent: 'border-indigo-500/40',
      badge: 'bg-indigo-500/20 text-indigo-300',
    },
    {
      id: 'in_review',
      title: 'In Review',
      icon: <Eye className="w-4 h-4 text-amber-400" />,
      accent: 'border-amber-500/40',
      badge: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
      accent: 'border-emerald-500/40',
      badge: 'bg-emerald-500/20 text-emerald-300',
    },
  ];

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOverColumn = (e, columnId) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeaveColumn = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverColumn(null);
  };

  // Dropping into column background / empty space (append to end)
  const handleDropOnColumn = (e, targetColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask) return;

    // Use full tasks pool to prevent losing or misordering filtered-out tasks
    const pool = allTasks.length > 0 ? allTasks : tasks;
    const columnTasks = pool
      .filter((t) => t.status === targetColumnId && t._id !== draggedTask._id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const reorderedList = [...columnTasks, { ...draggedTask, status: targetColumnId }];

    const updates = reorderedList.map((t, idx) => ({
      id: t._id,
      status: targetColumnId,
      order: idx,
    }));

    setDraggedTask(null);
    if (onReorderTasks) {
      onReorderTasks(updates);
    } else if (onMoveTask) {
      onMoveTask(draggedTask._id, targetColumnId);
    }
  };

  // Dropping onto a specific card within a column (insert at that position)
  const handleDropOnCard = (e, targetTask, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    if (!draggedTask || draggedTask._id === targetTask._id) return;

    const targetColumnId = targetTask.status;
    const pool = allTasks.length > 0 ? allTasks : tasks;
    const columnTasks = pool
      .filter((t) => t.status === targetColumnId && t._id !== draggedTask._id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Find target insertion index in the full pool
    const targetIdxInPool = columnTasks.findIndex((t) => t._id === targetTask._id);
    const insertIndex = targetIdxInPool !== -1 ? targetIdxInPool : targetIndex;

    columnTasks.splice(insertIndex, 0, { ...draggedTask, status: targetColumnId });

    const updates = columnTasks.map((t, idx) => ({
      id: t._id,
      status: targetColumnId,
      order: idx,
    }));

    setDraggedTask(null);
    if (onReorderTasks) {
      onReorderTasks(updates);
    }
  };

  return (
    <div className="flex-1 overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scroll-smooth">
      <div className="flex gap-4 min-w-max md:min-w-0 md:w-full h-full items-start">
        {columns.map((col) => {
          const colTasks = tasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOverColumn(e, col.id)}
              onDragLeave={(e) => handleDragLeaveColumn(e, col.id)}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              className={`w-[85vw] sm:w-[320px] md:w-auto md:flex-1 shrink-0 md:shrink snap-center flex flex-col rounded-2xl glass-panel p-3.5 transition-all duration-200 border ${
                isOver ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900/90' : 'border-slate-800/80 bg-slate-950/40'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
                    {col.icon}
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {col.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badge}`}>
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenCreateModal && onOpenCreateModal(col.id)}
                    title={`Create task in ${col.title}`}
                    className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Column Task Cards */}
              <div className="flex-1 min-h-[450px] overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-44 rounded-xl border border-dashed border-slate-800/80 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <p className="text-xs font-medium text-slate-400">No tickets yet</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Drag tickets here or speak via Wispr Flow
                    </p>
                  </div>
                ) : (
                  colTasks.map((task, idx) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      index={idx}
                      onClick={onTaskClick}
                      onDragStart={handleDragStart}
                      onDropOnCard={handleDropOnCard}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
