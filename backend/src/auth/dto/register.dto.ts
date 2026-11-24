import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'nurmuhammad@example.com', description: 'Foydalanuvchi elektron pochtasi' })
  @IsEmail({}, { message: "Noto'g'ri email formati" })
  @IsNotEmpty({ message: 'Email kiritilishi shart' })
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd', description: 'Parol (kamida 6 ta belgi)' })
  @IsString()
  @MinLength(6, { message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" })
  password: string;

  @ApiProperty({ example: 'Nurmuhammad', description: 'Foydalanuvchi ismi' })
  @IsString()
  @IsNotEmpty({ message: 'Ism kiritilishi shart' })
  firstName: string;

  @ApiProperty({ example: 'Askarov', description: 'Foydalanuvchi familiyasi' })
  @IsString()
  @IsNotEmpty({ message: 'Familiya kiritilishi shart' })
  lastName: string;
}
