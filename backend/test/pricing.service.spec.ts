import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PricingService } from '../src/modules/pricing/pricing.service';
import { MlClientService } from '../src/integrations/ml-client/ml-client.service';

const mockMlClient = {
  getRiskScore: jest.fn().mockResolvedValue({
    riskScore: 55,
    recommendedTier: 'PLUS',
    weeklyPremiumEstimate: 280,
    riskFactors: ['Mumbai is a high flood-risk city'],
  }),
  getFraudScore: jest.fn(),
  getDisruptionPrediction: jest.fn(),
};

const mockConfig = {
  get: jest.fn().mockReturnValue(undefined),
};

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: MlClientService, useValue: mockMlClient },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePremium', () => {
    const baseInput = {
      workerId: 'worker-001',
      city: 'Mumbai',
      zones: ['mumbai'],
      weeklyBaseEarning: 5000,
      avgHoursPerDay: 8,
      workingDaysPerWeek: 6,
      platform: 'ZOMATO',
      historicalClaims: 0,
    };

    it('BASIC tier should have lower premium than PLUS', async () => {
      const basic = await service.calculatePremium({ ...baseInput, tier: 'BASIC' });
      const plus  = await service.calculatePremium({ ...baseInput, tier: 'PLUS' });
      expect(basic.weeklyPremium).toBeLessThan(plus.weeklyPremium);
    });

    it('PLUS tier should have lower premium than MAX', async () => {
      const plus = await service.calculatePremium({ ...baseInput, tier: 'PLUS' });
      const max  = await service.calculatePremium({ ...baseInput, tier: 'MAX' });
      expect(plus.weeklyPremium).toBeLessThan(max.weeklyPremium);
    });

    it('maxPayout should be greater than minPayout for all tiers', async () => {
      for (const tier of ['BASIC', 'PLUS', 'MAX'] as const) {
        const result = await service.calculatePremium({ ...baseInput, tier });
        expect(result.maxPayout).toBeGreaterThan(result.minPayout);
      }
    });

    it('premium should be rounded to nearest ₹5', async () => {
      const result = await service.calculatePremium({ ...baseInput, tier: 'PLUS' });
      expect(result.weeklyPremium % 5).toBe(0);
    });

    it('high-claim-history worker should pay higher premium', async () => {
      const low  = await service.calculatePremium({ ...baseInput, tier: 'PLUS', historicalClaims: 0 });
      const high = await service.calculatePremium({ ...baseInput, tier: 'PLUS', historicalClaims: 5 });
      expect(high.weeklyPremium).toBeGreaterThanOrEqual(low.weeklyPremium);
    });

    it('should fall back to heuristic when ML service is down', async () => {
      mockMlClient.getRiskScore.mockRejectedValueOnce(new Error('ML service unavailable'));
      const result = await service.calculatePremium({ ...baseInput, tier: 'PLUS' });
      expect(result.weeklyPremium).toBeGreaterThan(0);
      expect(result.riskScore).toBeDefined();
    });
  });
});
