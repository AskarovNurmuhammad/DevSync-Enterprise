import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
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

  @Get()
  @ApiOperation({ summary: 'Loyiha vazifalarini olish (status va prioritet bo‘yicha filtrlash imkoni bilan)' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  getProjectTasks(
    @CurrentUser('id') userId: string,
    @Query('projectId') projectId: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
  ) {
    return this.tasksService.getProjectTasks(projectId, userId, status, priority);
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
