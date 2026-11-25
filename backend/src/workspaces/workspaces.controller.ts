import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi ish maydoni (Workspace) yaratish' })
  createWorkspace(@CurrentUser('id') userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.createWorkspace(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Foydalanuvchi a‘zo bo‘lgan barcha ish maydonlarini olish' })
  getUserWorkspaces(@CurrentUser('id') userId: string) {
    return this.workspacesService.getUserWorkspaces(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta ish maydoni va uning loyihalari/a‘zolarini olish' })
  getWorkspaceById(@CurrentUser('id') userId: string, @Param('id') workspaceId: string) {
    return this.workspacesService.getWorkspaceById(workspaceId, userId);
  }
}
