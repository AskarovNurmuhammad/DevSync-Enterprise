import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(userId: string, dto: CreateProjectDto) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: dto.workspaceId,
          userId,
        },
      },
    });

    if (!membership || membership.role === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Loyihalar yaratish uchun ruxsat yetarli emas');
    }

    const existingKey = await this.prisma.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: dto.workspaceId,
          key: dto.key.toUpperCase(),
        },
      },
    });

    if (existingKey) {
      throw new ConflictException('Bu loyiha kaliti (key) allaqachon mavjud');
    }

    const project = await this.prisma.project.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        key: dto.key.toUpperCase(),
        description: dto.description,
        color: dto.color || '#3b82f6',
        leadId: userId,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        workspaceId: dto.workspaceId,
        userId,
        action: 'PROJECT_CREATED',
        entityType: 'PROJECT',
        entityId: project.id,
      },
    });

    return project;
  }

  async getWorkspaceProjects(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Bu ish maydoniga kirish ruxsati yo‘q');
    }

    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Loyiha topilmadi');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: project.workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Bu loyihani ko‘rish huquqi yo‘q');
    }

    return project;
  }

  async updateProject(projectId: string, userId: string, dto: UpdateProjectDto) {
    const project = await this.getProjectById(projectId, userId);

    return this.prisma.project.update({
      where: { id: project.id },
      data: dto,
    });
  }
}
