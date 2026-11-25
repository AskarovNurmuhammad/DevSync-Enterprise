'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { 
  Kanban, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Database,
  Cpu,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  GitBranch
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const roadmap = [
    { day: 'Day 1', title: 'System Architecture & Data Modeling', status: 'Bajarildi ✓', current: false, completed: true },
    { day: 'Day 2', title: 'Multi-Tenant Auth & RBAC Security', status: 'Bajarildi ✓', current: false, completed: true },
    { day: 'Day 3', title: 'Core Business APIs & Dashboard Layout', status: 'Bajarildi ✓ (Day 3)', current: true, completed: true },
    { day: 'Day 4', title: 'Advanced Filters, Pagination & S3 Storage', status: 'Kutilmoqda', current: false, completed: false },
    { day: 'Day 5', title: 'WebSockets Live Board & Notifications', status: 'Kutilmoqda', current: false, completed: false },
    { day: 'Day 6', title: 'Admin Analytics, Audit Logs & PDF Reports', status: 'Kutilmoqda', current: false, completed: false },
    { day: 'Day 7', title: 'Docker Orchestration & CI/CD Production', status: 'Kutilmoqda', current: false, completed: false },
  ];

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 mb-12 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            DS
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              DevSync <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">ENTERPRISE OS</span>
            </h1>
            <p className="text-xs text-slate-400">High-Velocity B2B Multi-Tenant Platform</p>
          </div>
        </div>

        {/* Auth / Action Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboardga o‘tish
              </Link>
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 py-1.5 px-3 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                  {user.firstName?.[0] || 'U'}
                </div>
                <button
                  onClick={logout}
                  title="Chiqish"
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                Kirish
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          )}

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Day 3 Active
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-medium mb-6">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          Production-Grade 7-Day Engineering Sprint
        </div>
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Modern Workspace for <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            High-Performance Engineering Teams
          </span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">
          DevSync Enterprise combines real-time issue tracking, Kanban orchestration, 
          multi-tenant organizations, and WebSocket synchronizations into one lightning-fast workspace.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all"
          >
            {isAuthenticated ? 'Dashboardga Kirish' : 'Bepul Boshlash'} <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm transition-all"
          >
            Swagger API Docs ↗
          </a>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs text-slate-400">Tenancy</div>
              <div className="text-sm font-semibold text-white">Multi-Tenant</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
            <Kanban className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs text-slate-400">Board</div>
              <div className="text-sm font-semibold text-white">Live Kanban</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-xs text-slate-400">Database</div>
              <div className="text-sm font-semibold text-white">PostgreSQL 16</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
            <Activity className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xs text-slate-400">Real-Time</div>
              <div className="text-sm font-semibold text-white">Socket.io</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Day Sprint Roadmap Card */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-sm mb-16 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              7-Kunlik Sprint Yo'l Xaritasi (Roadmap)
            </h3>
            <p className="text-xs text-slate-400 mt-1">Har kuni bitta to'liq modul va GitHub commit bilan yuritiladi</p>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Sprint Progress: 42% (Day 3 / 7)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roadmap.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border transition-all ${
                item.completed
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : item.current 
                    ? 'bg-blue-950/30 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                    : 'bg-slate-900/30 border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  item.completed 
                    ? 'bg-emerald-600 text-white' 
                    : item.current 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.day}
                </span>
                {item.completed ? (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bajarildi
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">Kutilmoqda</span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">{item.title}</h4>
              <p className="text-xs text-slate-400">{item.status}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          DevSync Enterprise — Built with Next.js 15, NestJS & Prisma.
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            Node.js v24
          </span>
          <span className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-slate-400" />
            Git Controlled
          </span>
        </div>
      </footer>
    </main>
  );
}
