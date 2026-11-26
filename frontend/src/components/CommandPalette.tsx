'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspaceStore, Task } from '@/store/workspaceStore';
import { Search, X, FolderKanban, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { activeWorkspace, projects, selectProject, searchWorkspaceTasks, openTaskDetail } =
    useWorkspaceStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !activeWorkspace) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const items = await searchWorkspaceTasks({
        workspaceId: activeWorkspace.id,
        search: query.trim() || undefined,
        limit: 8,
        page: 1,
      });
      setResults(items);
      setIsSearching(false);
    }, 220);

    return () => clearTimeout(timer);
  }, [query, isOpen, activeWorkspace, searchWorkspaceTasks]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.key.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0d131f] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Vazifalar yoki loyihalarni qidiring..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {isSearching && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {filteredProjects.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
                Loyihalar
              </div>
              <div className="space-y-1">
                {filteredProjects.slice(0, 4).map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      selectProject(proj);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800/70 text-xs text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">{proj.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {proj.key}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
              Vazifalar
            </div>
            {results.length === 0 ? (
              <div className="text-xs text-slate-500 px-3 py-4 text-center">
                {isSearching ? 'Qidirilmoqda...' : 'Mos vazifalar topilmadi'}
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      openTaskDetail(task.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800/70 text-xs text-slate-200 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="font-mono text-[10px] text-slate-400">
                        {task.project?.key}-{task.taskNumber}
                      </span>
                      <span className="truncate font-medium">{task.title}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 ml-2 flex-shrink-0">
                      {task.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/40 flex justify-between text-[10px] text-slate-500">
          <span>Tanlash uchun bosing</span>
          <span>ESC — yopish</span>
        </div>
      </div>
    </div>
  );
}
