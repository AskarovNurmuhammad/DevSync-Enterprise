import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Yangi foydalanuvchini ro‘yxatdan o‘tkazish va shaxsiy workspace yaratish' })
  @ApiResponse({ status: 201, description: 'Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tdi' })
  @ApiResponse({ status: 409, description: 'Email allaqachon mavjud' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimga kirish va JWT tokenlarni olish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli autentifikatsiya' })
  @ApiResponse({ status: 401, description: 'Noto‘g‘ri ma‘lumotlar' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eskirgan Access tokenni Refresh token orqali yangilash' })
  @ApiResponse({ status: 200, description: 'Yangi tokenlar berildi' })
  @ApiResponse({ status: 401, description: 'Refresh token yaroqsiz yoki muddati tugagan' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy tizimga kirgan foydalanuvchi profili va ish maydonlari' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi ma‘lumotlari' })
  @ApiResponse({ status: 401, description: 'Avtorizatsiyadan o‘tilmagan' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
