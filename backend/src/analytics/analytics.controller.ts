import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics & Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('workspace/:workspaceId/overview')
  @ApiOperation({ summary: 'Ish maydoni bo‘yicha to‘liq statistika va grafik ma‘lumotlari' })
  getWorkspaceOverview(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.analyticsService.getWorkspaceOverview(workspaceId, userId);
  }

  @Get('workspace/:workspaceId/audit-logs')
  @ApiOperation({ summary: 'Ish maydoni Audit Loglar (harakatlar tarixi) jurnali' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false })
  getAuditLogs(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
  ) {
    return this.analyticsService.getAuditLogs(workspaceId, userId, { page, limit, action });
  }

  @Get('workspace/:workspaceId/export/csv')
  @ApiOperation({ summary: 'Barcha vazifalar hisobotini CSV/Excel formatida yuklab olish' })
  async exportCsv(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const { filename, csvContent } = await this.analyticsService.exportWorkspaceTasksCsv(
      workspaceId,
      userId,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  }
}
