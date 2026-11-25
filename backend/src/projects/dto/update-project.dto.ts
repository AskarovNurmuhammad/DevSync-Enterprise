import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Yangi loyiha nomi' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Yangi tavsif' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '#10b981' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
