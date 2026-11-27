import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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

  async inviteMember(workspaceId: string, currentUserId: string, dto: InviteMemberDto) {
    const requesterMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: currentUserId },
      },
      include: { workspace: true },
    });

    if (
      !requesterMembership ||
      (requesterMembership.role !== WorkspaceRole.OWNER && requesterMembership.role !== WorkspaceRole.ADMIN)
    ) {
      throw new ForbiddenException('Faqat Owner yoki Admin jamoaga a‘zo taklif qila oladi');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!targetUser) {
      throw new NotFoundException('Ushbu email bilan ro‘yxatdan o‘tgan foydalanuvchi topilmadi');
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUser.id },
      },
    });

    if (existingMember) {
      throw new ConflictException('Bu foydalanuvchi allaqachon ish maydoni a‘zosi');
    }

    const newRole = dto.role === WorkspaceRole.OWNER ? WorkspaceRole.ADMIN : dto.role || WorkspaceRole.MEMBER;

    const member = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role: newRole,
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        workspaceId,
        userId: currentUserId,
        action: 'MEMBER_INVITED',
        entityType: 'WORKSPACE',
        entityId: workspaceId,
        metadata: { invitedEmail: targetUser.email, role: newRole },
      },
    });

    await this.notifications.createNotification({
      userId: targetUser.id,
      workspaceId,
      title: 'Yangi jamoaga taklif',
      message: `Siz "${requesterMembership.workspace.name}" ish maydoniga ${newRole} sifatida qo‘shildingiz.`,
      type: 'WORKSPACE_INVITE',
      entityId: workspaceId,
    });

    return member;
  }
}
