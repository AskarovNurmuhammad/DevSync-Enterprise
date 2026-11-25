import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskPriority, TaskStatus, WorkspaceRole } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Auto calculate next taskNumber
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
        orderIndex: dto.orderIndex ?? (taskCount * 1.0),
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
          select: { id: true, key: true, name: true },
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

    return task;
  }

  async getProjectTasks(
    projectId: string,
    userId: string,
    status?: TaskStatus,
    priority?: TaskPriority,
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

    return this.prisma.task.findMany({
      where: {
        projectId,
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
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
          select: { comments: true },
        },
      },
      orderBy: [{ status: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'desc' }],
    });
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

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { message: 'Vazifa muvaffaqiyatli o‘chirildi' };
  }
}
