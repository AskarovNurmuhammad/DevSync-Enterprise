import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus;

  @ApiPropertyOptional({ example: 2.0, description: 'Drag-and-drop yangi tartib indeksi' })
  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
