import React, { useState } from 'react';
import { 
  X, 
  Mic, 
  Copy, 
  Check, 
  Trash2 
} from 'lucide-react';

export const TaskDrawer = ({ 
  task, 
  onClose, 
  onUpdateStatus, 
  onUpdateAssignee, 
  onDeleteTask,
  users 
}) => {
  const [copied, setCopied] = useState(false);

  if (!task) return null;

  const handleCopyMarkdown = () => {
    const fullText = `# [${task.priority}] ${task.title}\n\n**Type:** ${task.type}\n**Assignee:** ${task.assignee ? task.assignee.name : 'Unassigned'}\n**Labels:** ${(task.labels || []).join(', ')}\n\n## Specification\n${task.description}\n\n---\n*Raw Wispr Speech:* "${task.rawTranscript}"`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns = [
    { id: 'backlog', label: 'Backlog' },
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'in_review', label: 'In Review' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                task.priority === 'P0' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                task.priority === 'P1' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                task.priority === 'P2' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                'bg-slate-800 text-slate-400'
              }`}>
                {task.priority} Priority
              </span>

              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 capitalize">
                {task.type}
              </span>

              {task.source === 'voice-wispr' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 border border-purple-500/40 text-purple-300">
                  <Mic className="w-3 h-3 text-purple-400" />
                  Wispr Flow
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-100 leading-snug">
              {task.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action ribbon (Status + Assignee + Sprint) */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/20 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={task.status}
              onChange={(e) => onUpdateStatus(task._id, e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Assignee:</span>
            <select
              value={task.assignee ? task.assignee._id : ''}
              onChange={(e) => onUpdateAssignee(task._id, e.target.value || null)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
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

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Raw Wispr Flow Speech Box */}
          {task.rawTranscript && (
            <div className="rounded-xl p-4 bg-purple-950/20 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  Wispr Flow Speech Ingest
                </span>
                <span className="text-[10px] text-purple-400/80 font-mono">
                  Exact Audio Transcript
                </span>
              </div>
              <p className="text-xs text-purple-200 italic leading-relaxed bg-purple-900/20 p-2.5 rounded-lg border border-purple-500/20">
                "{task.rawTranscript}"
              </p>
            </div>
          )}

          {/* Structured Markdown Specification */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Engineered Task Specification</span>
            </h4>
            
            <div className="rounded-xl p-4 bg-slate-950/60 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {task.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Module Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-mono"
                  >
                    #{lbl}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div>
              <span className="block text-slate-500 mb-0.5">Created Date</span>
              <span className="font-medium text-slate-300">
                {new Date(task.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 mb-0.5">Sprint</span>
              <span className="font-medium text-slate-300">
                {task.sprint ? task.sprint.name : 'Sprint 4 - Active'}
              </span>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (window.confirm('Delete this task from sprint?')) {
                onDeleteTask(task._id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Ticket</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy GitHub Issue Markdown'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

