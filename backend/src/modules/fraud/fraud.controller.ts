import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('fraud')
@ApiBearerAuth('JWT')
@Roles(Role.INSURER, Role.ADMIN)
@Controller({ path: 'fraud', version: '1' })
export class FraudController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('signals')
  @ApiOperation({ summary: 'List recent fraud signals (insurer/admin)' })
  async getSignals(@Query('page') page = 1, @Query('limit') limit = 20) {
    const skip = (Number(page) - 1) * Number(limit);
    const [signals, total] = await Promise.all([
      this.prisma.fraudSignal.findMany({
        skip,
        take: Number(limit),
        orderBy: { detectedAt: 'desc' },
        include: { worker: { select: { name: true, city: true, platform: true } } },
      }),
      this.prisma.fraudSignal.count(),
    ]);
    return { data: signals, total, page: Number(page), limit: Number(limit) };
  }

  @Get('escalated-claims')
  @ApiOperation({ summary: 'List escalated claims awaiting manual review' })
  async getEscalatedClaims() {
    return this.prisma.claim.findMany({
      where: { status: 'ESCALATED' },
      orderBy: { createdAt: 'desc' },
      include: {
        worker: { select: { name: true, city: true, phone: true } },
        disruptionEvent: true,
      },
    });
  }
}
