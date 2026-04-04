import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MlClientService } from '../../integrations/ml-client/ml-client.service';

export interface PricingInput {
  workerId: string;
  city: string;
  zones: string[];
  weeklyBaseEarning: number;
  avgHoursPerDay: number;
  workingDaysPerWeek: number;
  platform: string;
  historicalClaims: number;
  tier: 'BASIC' | 'PLUS' | 'MAX';
}

export interface PricingOutput {
  weeklyPremium: number;
  minPayout: number;
  maxPayout: number;
  riskScore: number;
  riskFactors: string[];
}

// Coverage bands by tier (% of weekly base earning)
const TIER_COVERAGE = {
  BASIC: { minPct: 0.3, maxPct: 0.5, premiumPct: 0.035 },
  PLUS:  { minPct: 0.5, maxPct: 0.7, premiumPct: 0.055 },
  MAX:   { minPct: 0.7, maxPct: 0.9, premiumPct: 0.075 },
};

// City risk multipliers (heuristic – highest for flood-prone metros)
const CITY_RISK: Record<string, number> = {
  mumbai: 1.35, chennai: 1.30, kolkata: 1.25,
  hyderabad: 1.15, bangalore: 1.10, delhi: 1.20,
  pune: 1.10, ahmedabad: 1.05,
};

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly mlClient: MlClientService,
    private readonly config: ConfigService,
  ) {}

  async calculatePremium(input: PricingInput): Promise<PricingOutput> {
    const tier = TIER_COVERAGE[input.tier];
    const cityKey = input.city.toLowerCase().trim();
    const cityRisk = CITY_RISK[cityKey] ?? 1.0;

    // Seasonal multiplier
    const month = new Date().getMonth() + 1;
    const seasonMultiplier = month >= 6 && month <= 9 ? 1.25 : 1.0; // Monsoon

    // Behavioral multiplier from historical claims
    const claimMultiplier = 1 + Math.min(input.historicalClaims * 0.05, 0.3);

    // Night-work premium (proxy: avg hours > 10)
    const nightWorkMultiplier = input.avgHoursPerDay > 10 ? 1.1 : 1.0;

    const combinedMultiplier =
      cityRisk * seasonMultiplier * claimMultiplier * nightWorkMultiplier;

    const rawPremium = input.weeklyBaseEarning * tier.premiumPct * combinedMultiplier;
    const weeklyPremium = Math.ceil(rawPremium / 5) * 5; // Round up to nearest ₹5

    const minPayout = Math.round(input.weeklyBaseEarning * tier.minPct);
    const maxPayout = Math.round(input.weeklyBaseEarning * tier.maxPct);

    // Try to get ML risk score; fall back to heuristic
    let riskScore = 50;
    let riskFactors: string[] = [];
    try {
      const mlResult = await this.mlClient.getRiskScore({
        workerId: input.workerId,
        city: input.city,
        zones: input.zones,
        weeklyBaseEarning: input.weeklyBaseEarning,
        avgHoursPerDay: input.avgHoursPerDay,
        workingDaysPerWeek: input.workingDaysPerWeek,
        platform: input.platform,
        historicalClaims: input.historicalClaims,
        seasonality: month >= 6 && month <= 9 ? 'MONSOON' : 'NORMAL',
      });
      riskScore = mlResult.riskScore;
      riskFactors = mlResult.riskFactors;
    } catch (err) {
      this.logger.warn('ML pricing service unavailable, using heuristic risk score');
      riskScore = Math.round((combinedMultiplier - 1) * 100 + 30);
      riskFactors = this.buildHeuristicFactors(input, cityRisk, seasonMultiplier);
    }

    return { weeklyPremium, minPayout, maxPayout, riskScore, riskFactors };
  }

  private buildHeuristicFactors(
    input: PricingInput,
    cityRisk: number,
    seasonMultiplier: number,
  ): string[] {
    const factors: string[] = [];
    if (cityRisk > 1.2) factors.push('High flood-risk city');
    if (seasonMultiplier > 1) factors.push('Active monsoon season');
    if (input.historicalClaims > 2) factors.push('High claim history');
    if (input.avgHoursPerDay > 10) factors.push('Extended working hours');
    return factors;
  }
}
