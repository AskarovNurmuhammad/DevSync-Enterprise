import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskPriority, TaskStatus } from '@prisma/client';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi vazifa (Issue/Task) yaratish' })
  createTask(@CurrentUser('id') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(userId, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Workspace bo‘yicha server-side qidiruv va sahifalash (Pagination)' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchTasksPaginated(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tasksService.searchTasksPaginated(userId, {
      workspaceId,
      projectId,
      search,
      status,
      priority,
      page,
      limit,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Loyiha vazifalarini olish (status, prioritet va qidiruv filtrlari bilan)' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  getProjectTasks(
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('search') search?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.tasksService.getProjectTasks(projectId, userId, status, priority, search, assigneeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Vazifaning to‘liq tafsilotlari, izohlari va fayllarini olish' })
  getTaskById(@CurrentUser('id') userId: string, @Param('id') taskId: string) {
    return this.tasksService.getTaskById(taskId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Vazifa ma‘lumotlarini tahrirlash' })
  updateTask(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(taskId, userId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Vazifa statusini va Kanban doskadagi tartibini yangilash (Drag & Drop)' })
  updateTaskStatus(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateTaskStatus(taskId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Vazifani o‘chirish' })
  deleteTask(@CurrentUser('id') userId: string, @Param('id') taskId: string) {
    return this.tasksService.deleteTask(taskId, userId);
  }
}
