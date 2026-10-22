import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TaskCreateModal = ({ 
  isOpen, 
  onClose, 
  onCreateTask, 
  defaultStatus = 'todo', 
  sprint, 
  users = [] 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'bug',
    priority: 'P2',
    status: 'todo',
    labels: '',
    assignee: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        type: 'bug',
        priority: 'P2',
        status: defaultStatus || 'todo',
        labels: '',
        assignee: '',
        description: `### Context / Objective\n\n### Acceptance Criteria\n- [ ] Task requirement 1\n- [ ] Task requirement 2`,
      });
      setError(null);
    }
  }, [isOpen, defaultStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const parsedLabels = formData.labels
        .split(',')
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        labels: parsedLabels,
        assignee: formData.assignee || null,
        sprint: sprint ? sprint._id : null,
        description: formData.description,
        source: 'manual',
      };

      await onCreateTask(payload);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-200 relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Task</h2>
              <p className="text-xs text-slate-400">Add a ticket manually to {sprint?.name || 'Sprint'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Implement refresh token rotation middleware"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 capitalize"
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="refactor">Refactor</option>
                <option value="debt">Tech Debt</option>
                <option value="task">General Task</option>
              </select>
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="P0">P0 - Blocker</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - Normal</option>
                <option value="P3">P3 - Low</option>
              </select>
            </div>
          </div>

          {/* Status & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Column / Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Assignee
              </label>
              <select
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.labels}
              onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
              placeholder="auth, backend, api"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Markdown Description / Acceptance Criteria
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

