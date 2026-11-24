import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...', description: 'Refresh token' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token kiritilishi shart' })
  refreshToken: string;
}
