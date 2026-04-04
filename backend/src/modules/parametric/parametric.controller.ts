import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParametricService } from './parametric.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, DisruptionType, DisruptionSeverity } from '@prisma/client';

class MockDisruptionDto {
  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  zone: string;

  @ApiProperty({ enum: DisruptionType })
  @IsEnum(DisruptionType)
  type: DisruptionType;

  @ApiProperty({ enum: DisruptionSeverity })
  @IsEnum(DisruptionSeverity)
  severity: DisruptionSeverity;

  @ApiProperty({ example: 'Heavy Monsoon Rainfall Alert' })
  @IsString()
  title: string;
}

@ApiTags('disruptions')
@ApiBearerAuth('JWT')
@Controller({ path: 'disruptions', version: '1' })
export class ParametricController {
  constructor(private readonly parametricService: ParametricService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent disruption events' })
  async getRecentDisruptions() {
    return this.parametricService.getRecentDisruptions();
  }

  @Post('mock')
  @Roles(Role.ADMIN, Role.INSURER)
  @ApiOperation({ summary: 'Inject a mock disruption event (admin/insurer)' })
  async createMockDisruption(@Body() dto: MockDisruptionDto) {
    return this.parametricService.createMockDisruption(dto);
  }
}
