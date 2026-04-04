import { Test, TestingModule } from '@nestjs/testing';
import { FraudEngineService } from '../src/modules/fraud/fraud-engine.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { MlClientService } from '../src/integrations/ml-client/ml-client.service';

const mockPrisma = {
  claim: {
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
  },
  worker: {
    findUnique: jest.fn().mockResolvedValue({ deviceFingerprint: null, deviceFlags: null }),
  },
  fraudSignal: {
    create: jest.fn().mockResolvedValue({}),
  },
};

const mockMlClient = {
  getFraudScore: jest.fn().mockResolvedValue({
    totalScore: 20,
    locationTrust: 90,
    behavioralFlags: [],
    networkFlags: [],
  }),
};

describe('FraudEngineService', () => {
  let service: FraudEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MlClientService, useValue: mockMlClient },
      ],
    }).compile();
    service = module.get<FraudEngineService>(FraudEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluate', () => {
    const baseInput = {
      workerId: 'worker-001',
      claimId: 'claim-001',
      zone: 'Mumbai',
      disruptionType: 'WEATHER',
      expectedEarning: 800,
      actualEarning: 400,
      locationLogs: [],
    };

    it('should return APPROVE decision for low fraud score', async () => {
      mockMlClient.getFraudScore.mockResolvedValueOnce({ totalScore: 10, locationTrust: 95, behavioralFlags: [], networkFlags: [] });
      const result = await service.evaluate(baseInput);
      expect(result.decision).toBe('APPROVE');
      expect(result.totalScore).toBeLessThan(30);
    });

    it('should return ESCALATE for high fraud score', async () => {
      mockMlClient.getFraudScore.mockResolvedValueOnce({ totalScore: 85, locationTrust: 15, behavioralFlags: ['GPS_SPOOF'], networkFlags: ['SHARED_DEVICE'] });
      const result = await service.evaluate({ ...baseInput, actualEarning: 0 });
      expect(result.decision).toBe('ESCALATE');
    });

    it('should fall back to heuristics when ML is unavailable', async () => {
      mockMlClient.getFraudScore.mockRejectedValueOnce(new Error('ML down'));
      const result = await service.evaluate(baseInput);
      expect(result).toBeDefined();
      expect(['APPROVE', 'PARTIAL', 'ESCALATE']).toContain(result.decision);
    });

    it('should flag 100% income loss', async () => {
      mockMlClient.getFraudScore.mockResolvedValueOnce({ totalScore: 25, locationTrust: 80, behavioralFlags: [], networkFlags: [] });
      const result = await service.evaluate({ ...baseInput, actualEarning: 0 });
      // With 100% loss the behavioral flags should be non-empty
      const hasBehavioralFlag = result.behavioralFlags.some((f) => f.includes('100%') || f.includes('loss'));
      expect(hasBehavioralFlag).toBe(true);
    });
  });
});
