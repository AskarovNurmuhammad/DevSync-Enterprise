import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi loyiha (Project) yaratish' })
  createProject(@CurrentUser('id') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Workspace ga tegishli barcha loyihalarni olish' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getWorkspaceProjects(@CurrentUser('id') userId: string, @Query('workspaceId') workspaceId: string) {
    return this.projectsService.getWorkspaceProjects(workspaceId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta loyiha va uning barcha vazifalarini olish' })
  getProjectById(@CurrentUser('id') userId: string, @Param('id') projectId: string) {
    return this.projectsService.getProjectById(projectId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Loyiha ma‘lumotlarini yangilash' })
  updateProject(
    @CurrentUser('id') userId: string,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(projectId, userId, dto);
  }
}
