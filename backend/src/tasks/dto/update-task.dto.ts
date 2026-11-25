import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Yangi vazifa sarlavhasi' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Yangi batafsil tavsif' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 'user-uuid-...' })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ example: 1.5 })
  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
