import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { UploadsService, UploadedFilePayload } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('Uploads & Attachments')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('tasks/:taskId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vazifaga fayl yoki rasm biriktirish (max 10MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
          cb(null, `${uniqueSuffix}${safeExt}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  )
  uploadTaskAttachment(
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: UploadedFilePayload,
  ) {
    if (!file) {
      throw new BadRequestException('Yuklanadigan fayl tanlanmagan');
    }
    return this.uploadsService.attachFileToTask(taskId, userId, file);
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Yuklangan faylni olish/ko‘rish' })
  serveUploadedFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }
    return res.sendFile(filePath);
  }

  @Delete('attachments/:attachmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Biriktirilgan faylni o‘chirish' })
  deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.uploadsService.deleteAttachment(attachmentId, userId);
  }
}
