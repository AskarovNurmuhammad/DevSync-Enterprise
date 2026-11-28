'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspaceStore';
import {
  BarChart3,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  Download,
  Printer,
  History,
  Loader2,
  Layers,
  Activity,
} from 'lucide-react';

interface OverviewData {
  summary: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalMembers: number;
    urgentTasks: number;
  };
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  projectStats: {
    id: string;
    name: string;
    key: string;
    color: string;
    totalTasks: number;
    doneTasks: number;
    progressPercent: number;
  }[];
  memberWorkload: {
    userId: string;
    name: string;
    role: string;
    assignedCount: number;
    completedCount: number;
  }[];
  dailyActivity: {
    date: string;
    label: string;
    created: number;
    completed: number;
  }[];
}

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  WORKSPACE_CREATED: { label: 'Ish maydoni yaratildi', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  PROJECT_CREATED: { label: 'Loyiha yaratildi', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  TASK_CREATED: { label: 'Vazifa yaratildi', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  TASK_UPDATED: { label: 'Vazifa tahrirlandi', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  TASK_STATUS_CHANGED: { label: 'Status o‘zgardi', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  COMMENT_ADDED: { label: 'Izoh qo‘shildi', color: 'bg-slate-700/60 text-slate-200 border-slate-600/40' },
  FILE_ATTACHED: { label: 'Fayl biriktirildi', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  MEMBER_INVITED: { label: 'A‘zo taklif qilindi', color: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
};

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspaceStore();

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditMeta, setAuditMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      const [ovRes, logRes] = await Promise.all([
        api.get(`/analytics/workspace/${activeWorkspace.id}/overview`),
        api.get(
          `/analytics/workspace/${activeWorkspace.id}/audit-logs?page=${auditPage}&limit=10&action=${actionFilter}`,
        ),
      ]);
      setOverview(ovRes.data);
      setAuditLogs(logRes.data.items || []);
      setAuditMeta(logRes.data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch {
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, auditPage, actionFilter]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCsv = async () => {
    if (!activeWorkspace) return;
    setIsExporting(true);
    try {
      const res = await api.get(`/analytics/workspace/${activeWorkspace.id}/export/csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devsync-${activeWorkspace.slug}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ish maydoni tanlanmagan</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Analitika va Audit loglarni ko‘rish uchun tizimga kiring va chap menyudan ish maydonini tanlang.
        </p>
      </div>
    );
  }

  const maxDaily = Math.max(
    1,
    ...(overview?.dailyActivity.map((d) => Math.max(d.created, d.completed)) || [1]),
  );

  const statusMeta: { key: string; label: string; color: string }[] = [
    { key: 'TODO', label: 'Bajarilishi kerak', color: 'bg-slate-400' },
    { key: 'IN_PROGRESS', label: 'Jarayonda', color: 'bg-blue-500' },
    { key: 'IN_REVIEW', label: 'Tekshiruvda', color: 'bg-purple-500' },
    { key: 'DONE', label: 'Bajarildi', color: 'bg-emerald-500' },
    { key: 'BACKLOG', label: 'Backlog', color: 'bg-slate-600' },
  ];

  const priorityMeta: { key: string; label: string; color: string }[] = [
    { key: 'URGENT', label: 'Shoshilinch', color: 'bg-rose-500' },
    { key: 'HIGH', label: 'Yuqori', color: 'bg-amber-500' },
    { key: 'MEDIUM', label: 'O‘rta', color: 'bg-blue-500' },
    { key: 'LOW', label: 'Oddiy', color: 'bg-slate-500' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Admin Analitika va Audit Paneli
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            <span className="text-slate-200 font-medium">{activeWorkspace.name}</span> ish maydoni bo‘yicha real-vaqt ko‘rsatkichlar
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Excel / CSV Yuklab Olish
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            PDF / Chop Etish
          </button>
        </div>
      </div>

      {isLoading && !overview ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <span className="text-xs">Statistika hisoblanmoqda...</span>
        </div>
      ) : overview ? (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0d131f] border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">Jami Loyihalar</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{overview.summary.totalProjects}</div>
              <div className="text-[11px] text-slate-500 mt-1">Faol ish maydoni loyihalari</div>
            </div>

            <div className="bg-[#0d131f] border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">Bajarilish Ko‘rsatkichi</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{overview.summary.completionRate}%</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {overview.summary.completedTasks} / {overview.summary.totalTasks} vazifa tugallandi
              </div>
            </div>

            <div className="bg-[#0d131f] border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">Shoshilinch Vazifalar</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{overview.summary.urgentTasks}</div>
              <div className="text-[11px] text-slate-500 mt-1">Yakunlanmagan URGENT vazifalar</div>
            </div>

            <div className="bg-[#0d131f] border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">Jamoa A‘zolari</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{overview.summary.totalMembers}</div>
              <div className="text-[11px] text-slate-500 mt-1">Workspace ishtirokchilari</div>
            </div>
          </div>

          {/* Charts Row: 7-Day Activity Bar Chart + Status & Priority Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Bar Chart */}
            <div className="lg:col-span-2 bg-[#0d131f] border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    So‘nggi 7 Kunlik Dinamika
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Yaratilgan va bajarilgan vazifalar grafigi</p>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Yaratilgan
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Bajarilgan
                  </span>
                </div>
              </div>

              <div className="h-52 flex items-end justify-between gap-3 pt-4 border-b border-slate-800/80 pb-2">
                {overview.dailyActivity.map((day) => {
                  const createdH = Math.round((day.created / maxDaily) * 100);
                  const completedH = Math.round((day.completed / maxDaily) * 100);
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1.5 h-40">
                        <div
                          className="w-4 sm:w-5 bg-blue-500/80 hover:bg-blue-400 rounded-t-md transition-all relative group"
                          style={{ height: `${Math.max(4, createdH)}%` }}
                          title={`Yaratilgan: ${day.created}`}
                        >
                          {day.created > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-blue-300">
                              {day.created}
                            </span>
                          )}
                        </div>
                        <div
                          className="w-4 sm:w-5 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-md transition-all relative group"
                          style={{ height: `${Math.max(4, completedH)}%` }}
                          title={`Bajarilgan: ${day.completed}`}
                        >
                          {day.completed > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-300">
                              {day.completed}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status & Priority Distributions */}
            <div className="bg-[#0d131f] border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Holat Bo‘yicha Taqsimot</h3>
                <div className="space-y-2.5">
                  {statusMeta.map((st) => {
                    const count = overview.tasksByStatus[st.key] || 0;
                    const pct =
                      overview.summary.totalTasks > 0
                        ? Math.round((count / overview.summary.totalTasks) * 100)
                        : 0;
                    return (
                      <div key={st.key}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-300">{st.label}</span>
                          <span className="font-mono text-slate-400">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${st.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-3">Ustuvorlik Bo‘yicha</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {priorityMeta.map((pr) => (
                    <div
                      key={pr.key}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <span className={`w-2 h-2 rounded-full ${pr.color}`} />
                        {pr.label}
                      </span>
                      <span className="text-xs font-bold font-mono text-white">
                        {overview.tasksByPriority[pr.key] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Projects Progress & Team Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Progress */}
            <div className="bg-[#0d131f] border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Loyihalar Samaradorligi</h3>
              {overview.projectStats.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">Loyihalar mavjud emas</div>
              ) : (
                <div className="space-y-4">
                  {overview.projectStats.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: proj.color }}
                          />
                          <span className="font-semibold text-slate-200">{proj.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{proj.key}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-300">
                          {proj.doneTasks}/{proj.totalTasks} ({proj.progressPercent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${proj.progressPercent}%`,
                            backgroundColor: proj.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Workload */}
            <div className="bg-[#0d131f] border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Jamoa Yuklamasi (Workload)</h3>
              <div className="space-y-3">
                {overview.memberWorkload.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/70 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{member.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{member.role}</div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-mono">
                      <span className="text-blue-400">Biriktirilgan: {member.assignedCount}</span>
                      <span className="text-emerald-400">Bajarilgan: {member.completedCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-[#0d131f] border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  Audit Loglar Jurnali (Harakatlar Tarixi)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tizimdagi barcha muhim amallarning to‘liq xavfsizlik jurnali
                </p>
              </div>

              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 print:hidden"
              >
                <option value="ALL">Barcha harakatlar</option>
                <option value="TASK_CREATED">Vazifa yaratilgan</option>
                <option value="TASK_STATUS_CHANGED">Status o‘zgartirilgan</option>
                <option value="TASK_UPDATED">Vazifa tahrirlangan</option>
                <option value="COMMENT_ADDED">Izoh qo‘shilgan</option>
                <option value="FILE_ATTACHED">Fayl biriktirilgan</option>
                <option value="PROJECT_CREATED">Loyiha ochilgan</option>
                <option value="MEMBER_INVITED">A‘zo taklif qilingan</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/40">
                    <th className="py-3 px-4">Foydalanuvchi</th>
                    <th className="py-3 px-4">Harakat</th>
                    <th className="py-3 px-4">Obyekt</th>
                    <th className="py-3 px-4">Tafsilotlar</th>
                    <th className="py-3 px-4">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        Harakatlar tarixi hozircha bo‘sh
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const badge = ACTION_LABELS[log.action] || {
                        label: log.action,
                        color: 'bg-slate-800 text-slate-300 border-slate-700',
                      };
                      return (
                        <tr key={log.id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-4 font-medium text-slate-200">
                            {log.user.firstName} {log.user.lastName}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {log.entityType}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate">
                            {log.metadata ? JSON.stringify(log.metadata) : '—'}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/30 print:hidden">
              <span>
                Jami yozuvlar: <strong className="text-white">{auditMeta.total}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage <= 1}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  Oldingi
                </button>
                <span className="font-mono text-[11px]">
                  {auditMeta.page} / {auditMeta.totalPages}
                </span>
                <button
                  onClick={() => setAuditPage((p) => Math.min(auditMeta.totalPages, p + 1))}
                  disabled={auditPage >= auditMeta.totalPages}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
