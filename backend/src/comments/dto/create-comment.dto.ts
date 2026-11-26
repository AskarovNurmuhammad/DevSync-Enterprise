import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Ushbu modulni API bilan integratsiya qilish yakunlandi.', description: 'Izoh matni' })
  @IsString()
  @IsNotEmpty({ message: 'Izoh matni bo‘sh bo‘lishi mumkin emas' })
  content: string;
}
