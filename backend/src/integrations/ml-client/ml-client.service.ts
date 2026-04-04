import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';

export interface RiskScoreInput {
  workerId: string;
  city: string;
  zones: string[];
  weeklyBaseEarning: number;
  avgHoursPerDay: number;
  workingDaysPerWeek: number;
  platform: string;
  historicalClaims: number;
  seasonality: string;
}

export interface RiskScoreResult {
  riskScore: number;
  recommendedTier: string;
  weeklyPremiumEstimate: number;
  riskFactors: string[];
}

export interface FraudScoreInput {
  workerId: string;
  claimId: string;
  zone: string;
  disruptionType: string;
  expectedEarning: number;
  actualEarning: number;
  locationLogs: Array<{ lat: number; lng: number; ts: number; source: string }>;
}

export interface FraudScoreResult {
  totalScore: number;
  locationTrust: number;
  behavioralFlags: string[];
  networkFlags: string[];
}

@Injectable()
export class MlClientService {
  private readonly logger = new Logger(MlClientService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = config.get<string>('ML_SERVICE_URL', 'http://localhost:8000');
    this.timeoutMs = config.get<number>('ML_SERVICE_TIMEOUT_MS', 5000);
  }

  async getRiskScore(input: RiskScoreInput): Promise<RiskScoreResult> {
    return this.post<RiskScoreResult>('/api/v1/risk-score', input);
  }

  async getFraudScore(input: FraudScoreInput): Promise<FraudScoreResult> {
    return this.post<FraudScoreResult>('/api/v1/fraud-score', input);
  }

  async getDisruptionPrediction(zone: string, weekAhead: number) {
    return this.post('/api/v1/disruption-predict', { zone, weekAhead });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await firstValueFrom(
      this.httpService.post<T>(url, body, {
        headers: { 'Content-Type': 'application/json' },
      }).pipe(
        timeout(this.timeoutMs),
        retry({ count: 3, delay: 1000 }),
      ),
    );
    return response.data;
  }
}
