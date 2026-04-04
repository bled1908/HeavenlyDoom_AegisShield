import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { QuotePremiumDto } from '../policies/dto/policy.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('pricing')
@ApiBearerAuth('JWT')
@Controller({ path: 'pricing', version: '1' })
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  @Public()
  @ApiOperation({ summary: 'Calculate a premium quote given worker attributes and tier' })
  async quote(@Body() dto: QuotePremiumDto) {
    return this.pricingService.calculatePremium({
      workerId: 'quote-preview',
      city: dto.city,
      zones: [],
      weeklyBaseEarning: dto.weeklyBaseEarning,
      avgHoursPerDay: dto.avgHoursPerDay,
      workingDaysPerWeek: dto.workingDaysPerWeek,
      platform: dto.platform,
      historicalClaims: 0,
      tier: dto.tier,
    });
  }
}
