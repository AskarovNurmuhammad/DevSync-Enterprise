import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'f87d4a90-...', description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty({ message: 'Workspace ID kiritilishi shart' })
  workspaceId: string;

  @ApiProperty({ example: 'Core Platform Refactoring', description: 'Loyiha nomi' })
  @IsString()
  @IsNotEmpty({ message: 'Loyiha nomi kiritilishi shart' })
  name: string;

  @ApiProperty({ example: 'CORE', description: 'Loyiha kaliti (masalan: CORE-1, CORE-2)' })
  @IsString()
  @IsNotEmpty({ message: 'Loyiha kaliti kiritilishi shart' })
  @MaxLength(10, { message: 'Loyiha kaliti 10 ta belgidan oshmasligi kerak' })
  key: string;

  @ApiPropertyOptional({ example: 'Platformaning asosiy arxitekturasini yangilash', description: 'Tavsif' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '#3b82f6', description: 'Loyiha rangi' })
  @IsString()
  @IsOptional()
  color?: string;
}
