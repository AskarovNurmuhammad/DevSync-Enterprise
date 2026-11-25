import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const slug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          logoUrl: dto.logoUrl,
          ownerId: userId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      await tx.activityLog.create({
        data: {
          workspaceId: workspace.id,
          userId,
          action: 'WORKSPACE_CREATED',
          entityType: 'WORKSPACE',
          entityId: workspace.id,
        },
      });

      return workspace;
    });
  }

  async getUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                projects: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      userRole: m.role,
    }));
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Ushbu ish maydoniga kirish huquqingiz yo‘q');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        projects: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Ish maydoni topilmadi');
    }

    return {
      ...workspace,
      currentUserRole: membership.role,
    };
  }
}
