import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'b12c-9821-...', description: 'Project ID' })
  @IsString()
  @IsNotEmpty({ message: 'Loyiha ID kiritilishi shart' })
  projectId: string;

  @ApiProperty({ example: 'Foydalanuvchi avtorizatsiyasini sozlash', description: 'Vazifa nomi' })
  @IsString()
  @IsNotEmpty({ message: 'Vazifa sarlavhasi kiritilishi shart' })
  title: string;

  @ApiPropertyOptional({ example: 'JWT va Passport orqali xavfsizlikni ta‘minlash', description: 'Batafsil tavsif' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 'user-uuid-...', description: 'Biriktirilgan foydalanuvchi ID' })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ example: 0.0, description: 'Doskadagi tartib indeksi' })
  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
