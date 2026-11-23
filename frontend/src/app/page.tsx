import React from 'react';
import { 
  Kanban, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Users, 
  GitBranch, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

export default function HomePage() {
  const roadmap = [
    { day: 'Day 1', title: 'System Architecture & Data Modeling', status: 'In Progress (Day 1)', current: true },
    { day: 'Day 2', title: 'Multi-Tenant Auth & RBAC Security', status: 'Pending', current: false },
    { day: 'Day 3', title: 'Core Business APIs & Dashboard Layout', status: 'Pending', current: false },
    { day: 'Day 4', title: 'Advanced Filters, Pagination & S3 Storage', status: 'Pending', current: false },
    { day: 'Day 5', title: 'WebSockets Live Board & Notifications', status: 'Pending', current: false },
    { day: 'Day 6', title: 'Admin Analytics, Audit Logs & PDF Reports', status: 'Pending', current: false },
    { day: 'Day 7', title: 'Docker Orchestration & CI/CD Production', status: 'Pending', current: false },
  ];

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-6 mb-12">
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

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Day 1 Active
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
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs text-slate-400">Security</div>
              <div className="text-sm font-semibold text-white">RBAC Guarded</div>
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
          <div className="text-xs font-mono text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
            Sprint Progress: 14% (Day 1 / 7)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roadmap.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border transition-all ${
                item.current 
                  ? 'bg-blue-950/30 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-900/30 border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  item.current ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.day}
                </span>
                {item.current ? (
                  <span className="text-[11px] text-blue-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                    Jarayonda
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
