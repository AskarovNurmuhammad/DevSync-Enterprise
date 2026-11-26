import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadedFilePayload {
  originalname: string;
  filename: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async attachFileToTask(taskId: string, userId: string, file: UploadedFilePayload) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: { members: { where: { userId } } },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Vazifa topilmadi');
    }

    if (task.project.workspace.members.length === 0) {
      throw new ForbiddenException('Ushbu vazifaga fayl biriktirish huquqingiz yo‘q');
    }

    const fileUrl = `/api/v1/uploads/file/${file.filename}`;

    const attachment = await this.prisma.attachment.create({
      data: {
        taskId,
        uploaderId: userId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        userId,
        action: 'FILE_ATTACHED',
        entityType: 'TASK',
        entityId: taskId,
        metadata: { fileName: file.originalname, fileSize: file.size },
      },
    });

    await this.cache.invalidateByPrefix(`tasks:project:${task.projectId}`);
    return attachment;
  }

  async deleteAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { task: true },
    });

    if (!attachment) {
      throw new NotFoundException('Fayl topilmadi');
    }

    if (attachment.uploaderId !== userId) {
      throw new ForbiddenException('Faqat o‘zingiz yuklagan faylni o‘chirishingiz mumkin');
    }

    const storedName = path.basename(attachment.fileUrl);
    const fullPath = path.join(process.cwd(), 'uploads', storedName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    await this.cache.invalidateByPrefix(`tasks:project:${attachment.task.projectId}`);

    return { message: 'Fayl o‘chirildi' };
  }
}
