import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Vazifaga yangi izoh qo‘shish' })
  addComment(
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.addComment(taskId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Vazifaning barcha izohlarini olish' })
  getTaskComments(@Param('taskId') taskId: string, @CurrentUser('id') userId: string) {
    return this.commentsService.getTaskComments(taskId, userId);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Izohni o‘chirish' })
  deleteComment(@Param('commentId') commentId: string, @CurrentUser('id') userId: string) {
    return this.commentsService.deleteComment(commentId, userId);
  }
}
