'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore, TaskStatus, TaskPriority } from '@/store/workspaceStore';
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  Search,
  LayoutGrid,
  List,
  MessageSquare,
  Paperclip,
} from 'lucide-react';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'Bajarilishi kerak', color: '#94a3b8' },
  { id: 'IN_PROGRESS', label: 'Jarayonda', color: '#3b82f6' },
  { id: 'IN_REVIEW', label: 'Tekshiruvda', color: '#a855f7' },
  { id: 'DONE', label: 'Bajarildi', color: '#10b981' },
];

const STATUS_FLOW: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export default function DashboardKanbanPage() {
  const {
    activeWorkspace,
    activeProject,
    tasks,
    paginatedTasks,
    paginationMeta,
    fetchTasks,
    searchWorkspaceTasks,
    updateTaskStatus,
    createTask,
    openTaskDetail,
  } = useWorkspaceStore();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('TODO');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');

  // Debounced server-side search & filtering
  useEffect(() => {
    if (!activeProject || !activeWorkspace) return;

    const timer = setTimeout(() => {
      if (viewMode === 'board') {
        fetchTasks(activeProject.id, {
          search: searchQuery.trim() || undefined,
          priority: selectedPriorityFilter,
        });
      } else {
        searchWorkspaceTasks({
          workspaceId: activeWorkspace.id,
          projectId: activeProject.id,
          search: searchQuery.trim() || undefined,
          priority: selectedPriorityFilter,
          page: currentPage,
          limit: 8,
        });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [
    activeProject,
    activeWorkspace,
    searchQuery,
    selectedPriorityFilter,
    viewMode,
    currentPage,
    fetchTasks,
    searchWorkspaceTasks,
  ]);

  const handleOpenTaskModal = (status: TaskStatus = 'TODO') => {
    setModalDefaultStatus(status);
    setShowTaskModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const ok = await createTask({
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      status: modalDefaultStatus,
    });

    if (ok) {
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setShowTaskModal(false);
    }
  };

  const moveTask = (
    e: React.MouseEvent,
    taskId: string,
    currentStatus: TaskStatus,
    direction: 'forward' | 'backward',
  ) => {
    e.stopPropagation();
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (direction === 'forward' && currentIndex < STATUS_FLOW.length - 1) {
      updateTaskStatus(taskId, STATUS_FLOW[currentIndex + 1]);
    } else if (direction === 'backward' && currentIndex > 0) {
      updateTaskStatus(taskId, STATUS_FLOW[currentIndex - 1]);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">SHOSHILINCH</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">YUQORI</span>;
      case 'MEDIUM':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">O‘RTA</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">ODDIY</span>;
    }
  };

  if (!activeProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Loyiha tanlanmagan</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Kanban doskasini ko‘rish uchun chap tarafdagi menyudan loyihani tanlang yoki yangi loyiha oching.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeProject.color || '#3b82f6' }}
            />
            <h1 className="text-lg font-bold text-white tracking-tight">
              {activeProject.name}
            </h1>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
              {activeProject.key}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeProject.description || 'Sprint va vazifalar oqimi'}
          </p>
        </div>

        {/* Search, View Switcher, Priority Filters & Add Task */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Vazifalardan qidirish..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-52"
            />
          </div>

          {/* Priority Filter Pills */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {['ALL', 'URGENT', 'HIGH', 'MEDIUM'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setSelectedPriorityFilter(p);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium cursor-pointer ${
                  selectedPriorityFilter === p
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'ALL' ? 'Barchasi' : p}
              </button>
            ))}
          </div>

          {/* View Switcher: Board / List */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('board')}
              title="Kanban Doska"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'board' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Jadval ko‘rinishi (Pagination)"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => handleOpenTaskModal('TODO')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Vazifa Qo‘shish
          </button>
        </div>
      </div>

      {/* Board View vs Paginated List View */}
      {viewMode === 'board' ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-[#0b101c]/80 border border-slate-800/80 rounded-2xl p-3 flex flex-col h-[calc(100vh-14.5rem)] min-w-[280px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      {col.label}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenTaskModal(col.id)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
                    title="Ushbu ustunga vazifa qo'shish"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task Cards */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colTasks.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-center p-3">
                      <span className="text-[11px] text-slate-500">Vazifalar yo‘q</span>
                      <button
                        onClick={() => handleOpenTaskModal(col.id)}
                        className="text-[11px] text-blue-400 hover:underline mt-1 cursor-pointer"
                      >
                        + Qo‘shish
                      </button>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => openTaskDetail(task.id)}
                        className="bg-slate-900/90 hover:bg-slate-800/70 border border-slate-800 rounded-xl p-3 shadow-md hover:border-blue-500/40 transition-all group cursor-pointer"
                      >
                        {/* Top: Key & Priority */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            {activeProject.key}-{task.taskNumber}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-medium text-slate-100 mb-1.5 leading-snug">
                          {task.title}
                        </h4>

                        {/* Description preview */}
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 text-slate-400">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold"
                              title={task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Biriktirilmagan'}
                            >
                              {task.assignee?.firstName?.[0] || 'U'}
                            </div>
                            {(task._count?.comments || 0) > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <MessageSquare className="w-3 h-3" /> {task._count?.comments}
                              </span>
                            )}
                            {(task._count?.attachments || 0) > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Paperclip className="w-3 h-3" /> {task._count?.attachments}
                              </span>
                            )}
                          </div>

                          {/* Move controls */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {col.id !== 'TODO' && (
                              <button
                                onClick={(e) => moveTask(e, task.id, task.status, 'backward')}
                                title="Oldingi ustunga qaytarish"
                                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {col.id !== 'DONE' && (
                              <button
                                onClick={(e) => moveTask(e, task.id, task.status, 'forward')}
                                title="Keyingi ustunga o'tkazish"
                                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Paginated List View */
        <div className="flex-1 flex flex-col justify-between bg-[#0b101c]/80 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/40">
                  <th className="py-3 px-4">Kod</th>
                  <th className="py-3 px-4">Sarlavha</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4">Ustuvorlik</th>
                  <th className="py-3 px-4">Izohlar / Fayllar</th>
                  <th className="py-3 px-4">Ijrochi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Vazifalar topilmadi
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => openTaskDetail(task.id)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {activeProject.key}-{task.taskNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">{task.title}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getPriorityBadge(task.priority)}</td>
                      <td className="py-3 px-4 text-slate-400">
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {task._count?.comments || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> {task._count?.attachments || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Server-side Pagination Controls */}
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/30">
            <span>
              Jami: <strong className="text-white">{paginationMeta.total}</strong> ta vazifa
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Oldingi
              </button>
              <span className="font-mono text-[11px]">
                {paginationMeta.page} / {paginationMeta.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
                disabled={currentPage >= paginationMeta.totalPages}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Keyingi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> Yangi Vazifa ({activeProject.key})
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Vazifa Sarlavhasi
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: API xatoliklarini to'g'irlash"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ustuvorlik (Priority)
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="LOW">Oddiy (Low)</option>
                  <option value="MEDIUM">O‘rta (Medium)</option>
                  <option value="HIGH">Yuqori (High)</option>
                  <option value="URGENT">Shoshilinch (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Boshlang‘ich Holat
                </label>
                <select
                  value={modalDefaultStatus}
                  onChange={(e) => setModalDefaultStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="TODO">Bajarilishi kerak</option>
                  <option value="IN_PROGRESS">Jarayonda</option>
                  <option value="IN_REVIEW">Tekshiruvda</option>
                  <option value="DONE">Bajarildi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Batafsil Tavsif (ixtiyoriy)
                </label>
                <textarea
                  placeholder="Vazifa tafsilotlari va qilinishi kerak bo'lgan ishlar..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 h-24"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
                >
                  Vazifani Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
