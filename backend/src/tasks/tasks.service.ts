import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskPriority, TaskStatus, WorkspaceRole, Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async createTask(userId: string, dto: CreateTaskDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Loyiha topilmadi');
    }

    const member = project.workspace.members[0];
    if (!member || member.role === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Vazifalar yaratish huquqiga ega emassiz');
    }

    const taskCount = await this.prisma.task.count({
      where: { projectId: dto.projectId },
    });
    const nextTaskNumber = taskCount + 1;

    const task = await this.prisma.task.create({
      data: {
        taskNumber: nextTaskNumber,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || TaskPriority.MEDIUM,
        status: dto.status || TaskStatus.TODO,
        orderIndex: dto.orderIndex ?? taskCount * 1.0,
        creatorId: userId,
        assigneeId: dto.assigneeId,
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        project: {
          select: { id: true, key: true, name: true, color: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        workspaceId: project.workspaceId,
        userId,
        action: 'TASK_CREATED',
        entityType: 'TASK',
        entityId: task.id,
        metadata: { title: task.title, taskKey: `${project.key}-${task.taskNumber}` },
      },
    });

    await this.cache.invalidateByPrefix(`tasks:project:${dto.projectId}`);
    return task;
  }

  async getProjectTasks(
    projectId: string,
    userId: string,
    status?: TaskStatus,
    priority?: TaskPriority,
    search?: string,
    assigneeId?: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!project || project.workspace.members.length === 0) {
      throw new ForbiddenException('Ushbu loyiha vazifalarini ko‘rish huquqi yo‘q');
    }

    const cacheKey = `tasks:project:${projectId}:${status || 'ALL'}:${priority || 'ALL'}:${assigneeId || 'ALL'}:${search || ''}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Prisma.TaskWhereInput = {
      projectId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: {
          select: { id: true, key: true, color: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
      orderBy: [{ status: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'desc' }],
    });

    await this.cache.set(cacheKey, tasks, 30);
    return tasks;
  }

  async searchTasksPaginated(
    userId: string,
    params: {
      workspaceId: string;
      projectId?: string;
      search?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      page?: number;
      limit?: number;
    },
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Ushbu ish maydoniga kirish huquqi yo‘q');
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      project: { workspaceId: params.workspaceId },
      ...(params.projectId ? { projectId: params.projectId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          project: {
            select: { id: true, name: true, key: true, color: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
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

  async getTaskById(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploader: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Vazifa topilmadi');
    }

    const isMember = task.project.workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Ushbu vazifani ko‘rish huquqingiz yo‘q');
    }

    return task;
  }

  async updateTask(taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('Vazifa topilmadi');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.project.workspaceId,
          userId,
        },
      },
    });

    if (!membership || membership.role === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Vazifani tahrirlash huquqingiz yo‘q');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: dto,
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: {
          select: { id: true, key: true, color: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        userId,
        action: 'TASK_UPDATED',
        entityType: 'TASK',
        entityId: task.id,
        metadata: { updatedFields: Object.keys(dto) },
      },
    });

    await this.cache.invalidateByPrefix(`tasks:project:${task.projectId}`);
    return updated;
  }

  async updateTaskStatus(taskId: string, userId: string, dto: UpdateTaskStatusDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('Vazifa topilmadi');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        userId,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'TASK',
        entityId: task.id,
        metadata: { oldStatus: task.status, newStatus: dto.status },
      },
    });

    await this.cache.invalidateByPrefix(`tasks:project:${task.projectId}`);
    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('Vazifa topilmadi');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.project.workspaceId,
          userId,
        },
      },
    });

    if (!membership || membership.role === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Vazifani o‘chirish huquqingiz yo‘q');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    await this.cache.invalidateByPrefix(`tasks:project:${task.projectId}`);
    return { message: 'Vazifa muvaffaqiyatli o‘chirildi' };
  }
}
