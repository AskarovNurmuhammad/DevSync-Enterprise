import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'nurmuhammad@example.com', description: 'Foydalanuvchi elektron pochtasi' })
  @IsEmail({}, { message: "Noto'g'ri email formati" })
  @IsNotEmpty({ message: 'Email kiritilishi shart' })
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd', description: 'Foydalanuvchi paroli' })
  @IsString()
  @IsNotEmpty({ message: 'Parol kiritilishi shart' })
  @MinLength(6, { message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" })
  password: string;
}
