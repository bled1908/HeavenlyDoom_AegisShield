import { Controller, Get, Post, Delete, Param, Body, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto, QuotePremiumDto } from './dto/policy.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

interface AuthRequest{ user: { id: string; role: Role } }

@ApiTags('policies')
@ApiBearerAuth('JWT')
@Controller({ path: 'policies', version: '1' })
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post('quote')
  @ApiOperation({ summary: 'Get a premium quote for a given profile and tier (no auth required)' })
  async quote(@Request() req: AuthRequest, @Body() dto: QuotePremiumDto) {
    const workerId = req.user?.id ?? 'anonymous';
    return this.policiesService.quote(workerId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new weekly policy for the calling worker' })
  async create(@Request() req: AuthRequest, @Body() dto: CreatePolicyDto) {
    return this.policiesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all policies for the calling worker' })
  async getMyPolicies(@Request() req: AuthRequest) {
    return this.policiesService.getMyPolicies(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a policy' })
  async cancel(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.policiesService.cancelPolicy(req.user.id, id);
  }

  @Get('all')
  @Roles(Role.INSURER, Role.ADMIN)
  @ApiOperation({ summary: 'List all policies (insurer/admin)' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.policiesService.findAll(Number(page), Number(limit));
  }
}
