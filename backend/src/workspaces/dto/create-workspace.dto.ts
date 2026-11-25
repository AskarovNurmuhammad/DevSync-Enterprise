import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Fintech Solutions', description: 'Ish maydoni nomi' })
  @IsString()
  @IsNotEmpty({ message: 'Ish maydoni nomi kiritilishi shart' })
  name: string;

  @ApiPropertyOptional({ example: 'Moliyaviy loyihalar uchun ish maydoni', description: 'Tavsif' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png', description: 'Logotip havolasi' })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}
