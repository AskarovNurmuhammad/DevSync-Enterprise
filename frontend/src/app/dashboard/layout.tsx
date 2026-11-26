'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import CommandPalette from '@/components/CommandPalette';
import TaskDetailModal from '@/components/TaskDetailModal';
import {
  Layers,
  FolderKanban,
  Plus,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Settings,
  Bell,
  Search,
  LayoutDashboard,
  Users,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();
  const {
    workspaces,
    activeWorkspace,
    selectWorkspace,
    createWorkspace,
    fetchWorkspaces,
    projects,
    activeProject,
    selectProject,
    createProject,
  } = useWorkspaceStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // New Workspace form state
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');

  // New Project form state
  const [projName, setProjName] = useState('');
  const [projKey, setProjKey] = useState('');
  const [projDesc, setProjDesc] = useState('');

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, fetchWorkspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    const ok = await createWorkspace(wsName, wsDesc);
    if (ok) {
      setWsName('');
      setWsDesc('');
      setShowWorkspaceModal(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projKey.trim()) return;
    const ok = await createProject(projName, projKey.toUpperCase(), projDesc);
    if (ok) {
      setProjName('');
      setProjKey('');
      setProjDesc('');
      setShowProjectModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d131f] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-500/20">
                DS
              </div>
              <span className="font-bold text-sm tracking-wide text-white">DevSync Enterprise</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="mb-6">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex justify-between items-center">
              <span>Ish Maydoni</span>
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="text-blue-400 hover:text-blue-300 transition-colors p-0.5"
                title="Yangi Workspace qo'shish"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => selectWorkspace(ws)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                    activeWorkspace?.id === ws.id
                      ? 'bg-blue-600/15 border border-blue-500/30 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className={`w-3.5 h-3.5 ${activeWorkspace?.id === ws.id ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {ws.userRole && (
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                      {ws.userRole}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mb-6">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Asosiy Menyu
            </div>
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-white bg-slate-800/60 font-medium"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                <span>Kanban Doska</span>
              </Link>
            </nav>
          </div>

          {/* Projects Section */}
          <div className="flex-1">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex justify-between items-center">
              <span>Loyihalar ({projects.length})</span>
              <button
                onClick={() => setShowProjectModal(true)}
                className="text-blue-400 hover:text-blue-300 transition-colors p-0.5"
                title="Yangi Loyiha yaratish"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-slate-900/40 border border-slate-800/50 text-[11px] text-slate-500">
                  Hozircha loyihalar yo‘q. <br />
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="text-blue-400 hover:underline mt-1 font-medium inline-block"
                  >
                    + Loyiha yaratish
                  </button>
                </div>
              ) : (
                projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => selectProject(proj)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      activeProject?.id === proj.id
                        ? 'bg-blue-600/15 border border-blue-500/30 text-white font-medium'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: proj.color || '#3b82f6' }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">
                      {proj.key}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* User profile section at bottom */}
          <div className="pt-4 border-t border-slate-800/80 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="truncate text-left">
                  <div className="text-xs font-semibold text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                title="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800/80 bg-[#0d131f]/70 backdrop-blur-md px-4 md:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-white font-medium">{activeWorkspace?.name || 'Workspace'}</span>
              <span>/</span>
              <span className="text-blue-400 font-medium">{activeProject?.name || 'Loyiha tanlanmagan'}</span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden sm:flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-400 w-56 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Tezkor qidiruv...</span>
              <kbd className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</kbd>
            </button>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              Bosh sahifa
            </Link>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080c14]">
          {children}
        </main>
      </div>

      {/* Modal: Create Workspace */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" /> Yangi Ish Maydoni (Workspace)
              </h3>
              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Fintech Solutions"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tavsif (ixtiyoriy)</label>
                <textarea
                  placeholder="Ish maydoni maqsadi..."
                  value={wsDesc}
                  onChange={(e) => setWsDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Project */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-400" /> Yangi Loyiha Yaratish
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Loyiha Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Mobil Ilova"
                  value={projName}
                  onChange={(e) => {
                    setProjName(e.target.value);
                    if (!projKey) {
                      setProjKey(e.target.value.substring(0, 4).toUpperCase());
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Loyiha Kaliti (Prefix, masalan: APP-1, CORE-2)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="APP"
                  value={projKey}
                  onChange={(e) => setProjKey(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tavsif (ixtiyoriy)</label>
                <textarea
                  placeholder="Loyiha maqsadi va vazifalari..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
                >
                  Loyiha Ochish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Command Palette & Task Detail Modal */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
      <TaskDetailModal />
    </div>
  );
}
