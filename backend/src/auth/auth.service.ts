import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Ushbu email bilan foydalanuvchi allaqachon mavjud');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user and initial default workspace in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      // Default Workspace for user
      const slug = `${dto.firstName.toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`;
      const workspace = await tx.workspace.create({
        data: {
          name: `${dto.firstName}'s Workspace`,
          slug,
          ownerId: newUser.id,
        },
      });

      // Add user as OWNER of their workspace
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          role: WorkspaceRole.OWNER,
        },
      });

      // Initial activity log
      await tx.activityLog.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          action: 'WORKSPACE_CREATED',
          entityType: 'WORKSPACE',
          entityId: workspace.id,
          metadata: { note: 'Initial workspace created upon registration' },
        },
      });

      return newUser;
    });

    const tokens = await this.generateTokens(user.id, user.email, user.systemRole);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        systemRole: user.systemRole,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hisobingiz faol emas. Administratorga murojaat qiling');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    const tokens = await this.generateTokens(user.id, user.email, user.systemRole);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        systemRole: user.systemRole,
        workspaces: user.memberships.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          role: m.role,
        })),
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'super_secret_refresh_key_devsync_enterprise_2026_change_me';
      const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Yaroqsiz token yoki foydalanuvchi mavjud emas');
      }

      return this.generateTokens(user.id, user.email, user.systemRole);
    } catch {
      throw new UnauthorizedException('Refresh token muddati tugagan yoki yaroqsiz');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        systemRole: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, systemRole: string) {
    const payload = { sub: userId, email, systemRole };

    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_devsync_enterprise_2026_change_me';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'super_secret_refresh_key_devsync_enterprise_2026_change_me';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 mins
    };
  }
}
