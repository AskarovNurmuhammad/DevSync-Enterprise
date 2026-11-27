import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({ example: 'developer@example.com', description: 'Taklif qilinayotgan foydalanuvchi emaili' })
  @IsEmail({}, { message: 'Noto‘g‘ri email formati' })
  @IsNotEmpty({ message: 'Email kiritilishi shart' })
  email: string;

  @ApiPropertyOptional({ enum: WorkspaceRole, example: WorkspaceRole.MEMBER })
  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}
