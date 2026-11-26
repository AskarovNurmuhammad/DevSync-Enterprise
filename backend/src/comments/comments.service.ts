import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async addComment(taskId: string, userId: string, dto: CreateCommentDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: { where: { userId } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Vazifa topilmadi');
    }

    if (task.project.workspace.members.length === 0) {
      throw new ForbiddenException('Ushbu vazifaga izoh qoldirish huquqingiz yo‘q');
    }

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        userId,
        content: dto.content,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        userId,
        action: 'COMMENT_ADDED',
        entityType: 'TASK',
        entityId: taskId,
        metadata: { commentId: comment.id },
      },
    });

    await this.cache.invalidateByPrefix(`tasks:project:${task.projectId}`);
    return comment;
  }

  async getTaskComments(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: { members: { where: { userId } } },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Vazifa topilmadi');
    }

    if (task.project.workspace.members.length === 0) {
      throw new ForbiddenException('Izohlarni ko‘rish huquqingiz yo‘q');
    }

    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: true },
    });

    if (!comment) {
      throw new NotFoundException('Izoh topilmadi');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Faqat o‘z izohingizni o‘chirishingiz mumkin');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    await this.cache.invalidateByPrefix(`tasks:project:${comment.task.projectId}`);

    return { message: 'Izoh o‘chirildi' };
  }
}
