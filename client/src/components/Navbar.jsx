import React from 'react';
import { 
  Mic, 
  Flame, 
  Layers, 
  Search, 
  Plus
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const Navbar = ({ 
  sprint, 
  stats, 
  onOpenVoiceModal,
  onOpenCreateModal, 
  searchQuery, 
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  users,
  selectedUser,
  setSelectedUser
}) => {
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main top bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
              <Mic className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  VoiceSprint
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Wispr Flow
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Gemini AI
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {isConnected ? 'Real-Time Sync Active' : 'Connecting to Server...'}
              </p>
            </div>
          </div>

          {/* Active Sprint Pill */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Sprint:</span>
            <span className="font-medium text-slate-200">
              {sprint ? sprint.name : 'Sprint 4 - Real-Time Voice & Flow'}
            </span>
          </div>

          {/* Right Action: Manual Create + Voice Dictate CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs sm:text-sm font-medium border border-slate-800 transition-all"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>New Task</span>
            </button>

            <button
              onClick={onOpenVoiceModal}
              className="relative group flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
              <span>Voice Dictate</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-mono bg-indigo-900/60 border border-indigo-400/30 rounded text-indigo-200">
                Alt+V
              </kbd>
            </button>
          </div>
        </div>

        {/* Filters and Metric Ribbon */}
        <div className="py-2.5 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Search & Priority filters */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter tasks by keyword, tag, or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="P0">P0 - Blocker</option>
              <option value="P1">P1 - Critical</option>
              <option value="P2">P2 - Normal</option>
              <option value="P3">P3 - Low</option>
            </select>
          </div>

          {/* User Filter Chips */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] mr-1">Assignee:</span>
            <button
              onClick={() => setSelectedUser('ALL')}
              className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                selectedUser === 'ALL'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-medium'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Everyone
            </button>
            {users.map((u) => (
              <button
                key={u._id}
                onClick={() => setSelectedUser(u._id)}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1 transition-colors ${
                  selectedUser === u._id
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-medium'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-slate-700 text-[9px] flex items-center justify-center font-bold text-slate-200">
                  {u.initials || u.name.slice(0, 2).toUpperCase()}
                </span>
                {u.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-slate-500">Tasks:</span>
              <span className="font-semibold text-slate-200">{stats.total}</span>
            </div>
            {stats.p0 > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold animate-pulse">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>{stats.p0} Blocker{stats.p0 > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-slate-500">In Progress:</span>
              <span className="font-semibold text-indigo-400">{stats.inProgress}</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

