import React from 'react';
import { 
  Bug, 
  Sparkles, 
  RefreshCw, 
  Archive, 
  CheckSquare, 
  Mic, 
  Clock, 
  User as UserIcon 
} from 'lucide-react';

export const TaskCard = ({ 
  task, 
  index,
  onClick, 
  onDragStart,
  onDragOverCard,
  onDropOnCard 
}) => {
  // Priority color config
  const priorityStyles = {
    P0: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      label: 'P0 Blocker',
      glow: 'shadow-rose-950/40',
      dot: 'bg-rose-500',
    },
    P1: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      label: 'P1 Critical',
      glow: 'shadow-amber-950/20',
      dot: 'bg-amber-500',
    },
    P2: {
      bg: 'bg-sky-500/15',
      text: 'text-sky-300',
      border: 'border-sky-500/30',
      label: 'P2 Normal',
      glow: 'shadow-sky-950/20',
      dot: 'bg-sky-500',
    },
    P3: {
      bg: 'bg-slate-500/15',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      label: 'P3 Low',
      glow: '',
      dot: 'bg-slate-500',
    },
  };

  const pConfig = priorityStyles[task.priority] || priorityStyles.P2;

  // Type icon config
  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-3.5 h-3.5 text-rose-400" />;
      case 'feature':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'refactor':
        return <RefreshCw className="w-3.5 h-3.5 text-sky-400" />;
      case 'debt':
        return <Archive className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task._id);
    if (onDragStart) onDragStart(task);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDragOverCard) onDragOverCard(e, task, index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDropOnCard) onDropOnCard(e, task, index);
      }}
      onClick={() => onClick(task)}
      className="glass-card rounded-xl p-3.5 mb-3 cursor-grab active:cursor-grabbing border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 group relative select-none"
    >
      {/* Top badges: Priority + Type + Voice Origin */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot} ${task.priority === 'P0' ? 'animate-ping' : ''}`} />
            {pConfig.label}
          </span>

          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-400 capitalize">
            {getTypeIcon(task.type)}
            <span>{task.type}</span>
          </span>
        </div>

        {task.source === 'voice-wispr' && (
          <span 
            title="Ingested via Wispr Flow speech"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300"
          >
            <Mic className="w-2.5 h-2.5 text-purple-400" />
            <span>Wispr</span>
          </span>
        )}

        {task.aiPowered && (
          <span 
            title="Structured by Google Gemini 2.5 Flash"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-indigo-500/20 to-purple-500/25 border border-indigo-400/40 text-indigo-300 shadow-sm"
          >
            <Sparkles className="w-2.5 h-2.5 text-purple-300 animate-pulse" />
            <span>Gemini AI</span>
          </span>
        )}
      </div>

      {/* Task Title */}
      <h3 className="text-sm font-medium text-slate-100 group-hover:text-indigo-300 line-clamp-2 leading-snug mb-2.5 transition-colors">
        {task.title}
      </h3>

      {/* Tags / Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 3).map((lbl, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 border border-slate-800"
            >
              #{lbl}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-slate-500 self-center">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Assignee & Date */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-[10px] flex items-center justify-center ring-1 ring-slate-700">
                {task.assignee.initials || task.assignee.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-300 font-medium truncate max-w-[100px]">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <UserIcon className="w-3.5 h-3.5" />
              <span>Unassigned</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};

