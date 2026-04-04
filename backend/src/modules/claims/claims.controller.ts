import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

interface AuthRequest { user: { id: string; role: Role } }

@ApiTags('claims')
@ApiBearerAuth('JWT')
@Controller({ path: 'claims', version: '1' })
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get all claims for the calling worker' })
  async getMyClaims(@Request() req: AuthRequest) {
    return this.claimsService.getMyClaims(req.user.id);
  }

  @Get('queue-stats')
  @Roles(Role.INSURER, Role.ADMIN)
  @ApiOperation({ summary: 'Bull queue processing statistics' })
  async getQueueStats() {
    return this.claimsService.getQueueStats();
  }

  @Get('all')
  @Roles(Role.INSURER, Role.ADMIN)
  @ApiOperation({ summary: 'List all claims (insurer/admin)' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.claimsService.getAllClaims(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific claim detail' })
  async findOne(@Param('id') id: string) {
    return this.claimsService.getClaimById(id);
  }
}
