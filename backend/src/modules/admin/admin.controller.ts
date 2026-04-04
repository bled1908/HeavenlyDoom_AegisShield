import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth('JWT')
@Roles(Role.INSURER, Role.ADMIN)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get KPI dashboard data for insurer' })
  async getDashboard() {
    return this.adminService.getDashboardKPIs();
  }

  @Get('zone-risk')
  @ApiOperation({ summary: 'Zone-level disruption risk data (for heatmap)' })
  async getZoneRisk() {
    return this.adminService.getZoneRiskData();
  }

  @Get('loss-ratio-trend')
  @ApiOperation({ summary: 'Loss ratio trend (last 30 days, by city)' })
  async getLossRatio() {
    return this.adminService.getLossRatioByCityOverTime();
  }

  @Get('fraud-alerts')
  @ApiOperation({ summary: 'Recent fraud alerts feed' })
  async getFraudAlerts() {
    return this.adminService.getRecentFraudAlerts();
  }
}
