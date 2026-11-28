import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { TaskPriority, TaskStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private async verifyMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: { workspace: true },
    });

    if (!membership) {
      throw new ForbiddenException('Ushbu ish maydoni statistikalarini ko‘rish huquqingiz yo‘q');
    }

    return membership;
  }

  async getWorkspaceOverview(workspaceId: string, userId: string) {
    await this.verifyMembership(workspaceId, userId);

    const cacheKey = `analytics:overview:${workspaceId}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const [projects, tasks, members] = await Promise.all([
      this.prisma.project.findMany({
        where: { workspaceId },
        include: {
          _count: { select: { tasks: true } },
        },
      }),
      this.prisma.task.findMany({
        where: { project: { workspaceId } },
        select: {
          id: true,
          status: true,
          priority: true,
          projectId: true,
          assigneeId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const urgentTasks = tasks.filter(
      (t) => t.priority === TaskPriority.URGENT && t.status !== TaskStatus.DONE,
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Status distribution
    const tasksByStatus: Record<TaskStatus, number> = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    tasks.forEach((t) => {
      tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
    });

    // Priority distribution
    const tasksByPriority: Record<TaskPriority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };
    tasks.forEach((t) => {
      tasksByPriority[t.priority] = (tasksByPriority[t.priority] || 0) + 1;
    });

    // Per-project breakdown
    const projectStats = projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const pDone = pTasks.filter((t) => t.status === TaskStatus.DONE).length;
      return {
        id: p.id,
        name: p.name,
        key: p.key,
        color: p.color || '#3b82f6',
        totalTasks: pTasks.length,
        doneTasks: pDone,
        progressPercent: pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0,
      };
    });

    // Member workload
    const memberWorkload = members.map((m) => {
      const assigned = tasks.filter((t) => t.assigneeId === m.user.id);
      const done = assigned.filter((t) => t.status === TaskStatus.DONE).length;
      return {
        userId: m.user.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        role: m.role,
        assignedCount: assigned.length,
        completedCount: done,
      };
    });

    // Last 7 days daily trend
    const dailyActivity: { date: string; label: string; created: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric' });

      const created = tasks.filter((t) => t.createdAt.toISOString().slice(0, 10) === dateStr).length;
      const completed = tasks.filter(
        (t) => t.status === TaskStatus.DONE && t.updatedAt.toISOString().slice(0, 10) === dateStr,
      ).length;

      dailyActivity.push({ date: dateStr, label, created, completed });
    }

    const result = {
      summary: {
        totalProjects: projects.length,
        totalTasks,
        completedTasks,
        completionRate,
        totalMembers: members.length,
        urgentTasks,
      },
      tasksByStatus,
      tasksByPriority,
      projectStats,
      memberWorkload,
      dailyActivity,
      cacheStats: this.cache.getStats(),
    };

    await this.cache.set(cacheKey, result, 20);
    return result;
  }

  async getAuditLogs(
    workspaceId: string,
    userId: string,
    params: { page?: number; limit?: number; action?: string },
  ) {
    await this.verifyMembership(workspaceId, userId);

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 15));
    const skip = (page - 1) * limit;

    const where = {
      workspaceId,
      ...(params.action && params.action !== 'ALL' ? { action: params.action } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async exportWorkspaceTasksCsv(workspaceId: string, userId: string) {
    const membership = await this.verifyMembership(workspaceId, userId);

    const tasks = await this.prisma.task.findMany({
      where: { project: { workspaceId } },
      include: {
        project: { select: { key: true, name: true } },
        assignee: { select: { firstName: true, lastName: true, email: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ projectId: 'asc' }, { taskNumber: 'asc' }],
    });

    const escapeCsv = (val: string | number | null | undefined) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Kod',
      'Loyiha',
      'Sarlavha',
      'Holat',
      'Ustuvorlik',
      'Ijrochi',
      'Yaratuvchi',
      'Yaratilgan sana',
    ];

    const rows = tasks.map((t) => [
      `${t.project.key}-${t.taskNumber}`,
      t.project.name,
      t.title,
      t.status,
      t.priority,
      t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Biriktirilmagan',
      `${t.creator.firstName} ${t.creator.lastName}`,
      t.createdAt.toISOString().slice(0, 19).replace('T', ' '),
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for clean Excel opening
      [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

    return {
      filename: `devsync-${membership.workspace.slug}-report.csv`,
      csvContent,
    };
  }
}
