import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('payouts')
@ApiBearerAuth('JWT')
@Controller({ path: 'payouts', version: '1' })
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('stats')
  @Roles(Role.INSURER, Role.ADMIN)
  @ApiOperation({ summary: 'Payout statistics (insurer/admin)' })
  async getStats() {
    return this.payoutsService.getPayoutStats();
  }
}
