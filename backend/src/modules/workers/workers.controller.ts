import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { CreateWorkerDto, UpdateWorkerDto } from './dto/worker.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

interface AuthRequest {
  user: { id: string; role: Role };
}

@ApiTags('workers')
@ApiBearerAuth('JWT')
@Controller({ path: 'workers', version: '1' })
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a worker profile (onboarding)' })
  async create(@Request() req: AuthRequest, @Body() dto: CreateWorkerDto) {
    return this.workersService.create(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the calling worker\'s profile with active policy and recent claims' })
  async getMyProfile(@Request() req: AuthRequest) {
    return this.workersService.findByUserId(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update calling worker\'s profile' })
  async updateMyProfile(@Request() req: AuthRequest, @Body() dto: UpdateWorkerDto) {
    return this.workersService.update(req.user.id, dto);
  }

  @Get()
  @Roles(Role.INSURER, Role.ADMIN)
  @ApiOperation({ summary: 'List all workers (insurer/admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.workersService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @Roles(Role.INSURER, Role.ADMIN)
  @ApiOperation({ summary: 'Get a specific worker by ID (insurer/admin)' })
  async findOne(@Param('id') id: string) {
    return this.workersService.findById(id);
  }
}
