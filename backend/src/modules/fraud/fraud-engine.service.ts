import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MlClientService } from '../../integrations/ml-client/ml-client.service';
import { ClaimStatus, FraudSeverity } from '@prisma/client';

export interface FraudCheckInput {
  workerId: string;
  claimId: string;
  zone: string;
  disruptionType: string;
  expectedEarning: number;
  actualEarning: number;
  locationLogs: Array<{ lat: number; lng: number; ts: number; source: string }>;
}

export interface FraudCheckResult {
  totalScore: number; // 0=clean, 100=very suspicious
  locationTrustScore: number;
  behavioralFlags: string[];
  networkFlags: string[];
  decision: 'APPROVE' | 'PARTIAL' | 'ESCALATE';
  explanation: string;
}

@Injectable()
export class FraudEngineService {
  private readonly logger = new Logger(FraudEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
  ) {}

  async evaluate(input: FraudCheckInput): Promise<FraudCheckResult> {
    const [mlResult, historicalStats, networkFlags] = await Promise.allSettled([
      this.mlClient.getFraudScore(input),
      this.getHistoricalBehavior(input.workerId),
      this.checkNetworkLinks(input.workerId),
    ]);

    // ML fraud score
    let locationTrustScore = 75;
    let behavioralFlags: string[] = [];
    let mlFraudScore = 30;

    if (mlResult.status === 'fulfilled') {
      locationTrustScore = mlResult.value.locationTrust;
      behavioralFlags = mlResult.value.behavioralFlags;
      mlFraudScore = mlResult.value.totalScore;
    } else {
      this.logger.warn('ML fraud service unavailable, using heuristics');
      const heuristic = this.heuristicFraudScore(input);
      mlFraudScore = heuristic.score;
      behavioralFlags = heuristic.flags;
    }

    // Network/Graph flags
    const networkFlagList: string[] =
      networkFlags.status === 'fulfilled' ? networkFlags.value : [];

    // Historical behavior flags
    const historicalFlagList: string[] =
      historicalStats.status === 'fulfilled'
        ? this.evaluateHistory(historicalStats.value)
        : [];

    const allBehaviorFlags = [...behavioralFlags, ...historicalFlagList];

    // Aggregate total risk score
    const locationPenalty = Math.max(0, (100 - locationTrustScore) * 0.4);
    const networkPenalty = networkFlagList.length * 15;
    const behaviorPenalty = allBehaviorFlags.length * 8;
    const totalScore = Math.min(100, mlFraudScore * 0.5 + locationPenalty + networkPenalty + behaviorPenalty);

    // Tiered decision
    let decision: FraudCheckResult['decision'];
    let explanation: string;

    if (totalScore < 30) {
      decision = 'APPROVE';
      explanation = 'Low fraud risk – instant parametric payout approved';
    } else if (totalScore < 70) {
      decision = 'PARTIAL';
      explanation = `Medium fraud risk (score: ${totalScore.toFixed(0)}) – partial payout with enhanced monitoring`;
    } else {
      decision = 'ESCALATE';
      explanation = `High fraud risk (score: ${totalScore.toFixed(0)}) – escalated to manual review`;
    }

    // Persist fraud signals for high/medium risk
    if (totalScore > 30) {
      await this.persistFraudSignals(input.workerId, allBehaviorFlags, networkFlagList, totalScore);
    }

    // Update claim with fraud scores
    await this.prisma.claim.update({
      where: { id: input.claimId },
      data: {
        fraudScore: totalScore,
        locationTrustScore,
        behavioralFlags: allBehaviorFlags,
        networkFlags: networkFlagList,
      },
    });

    this.logger.log(
      `Fraud check for claim ${input.claimId}: score=${totalScore.toFixed(0)}, decision=${decision}`,
    );

    return {
      totalScore,
      locationTrustScore,
      behavioralFlags: allBehaviorFlags,
      networkFlags: networkFlagList,
      decision,
      explanation,
    };
  }

  private heuristicFraudScore(input: FraudCheckInput): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 20;

    // Perfect 100% income loss is suspicious
    if (input.actualEarning === 0 && input.expectedEarning > 0) {
      flags.push('100% income loss claimed');
      score += 20;
    }

    // Very high loss ratio > 90%
    const lossRatio = (input.expectedEarning - input.actualEarning) / input.expectedEarning;
    if (lossRatio > 0.9) {
      flags.push('Extreme loss ratio (>90%)');
      score += 10;
    }

    return { score, flags };
  }

  private async getHistoricalBehavior(workerId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const claims = await this.prisma.claim.findMany({
      where: { workerId, createdAt: { gte: thirtyDaysAgo } },
      select: { status: true, fraudScore: true, actualEarning: true, expectedEarning: true },
    });
    return claims;
  }

  private evaluateHistory(
    claims: Array<{ status: string; fraudScore: number | null; actualEarning: unknown; expectedEarning: unknown }>,
  ): string[] {
    const flags: string[] = [];
    if (claims.length > 5) flags.push('High claim frequency (>5 in 30 days)');
    const previousFlags = claims.filter((c) => (c.fraudScore ?? 0) > 50).length;
    if (previousFlags > 1) flags.push('History of flagged claims');
    return flags;
  }

  private async checkNetworkLinks(workerId: string): Promise<string[]> {
    // Graph-level detection: check if device fingerprint or IP is shared
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: { deviceFingerprint: true, deviceFlags: true },
    });
    const flags: string[] = [];
    if (worker?.deviceFlags) {
      const flags_data = worker.deviceFlags as Record<string, boolean>;
      if (flags_data['emulator']) flags.push('Device emulator detected');
      if (flags_data['mockLocation']) flags.push('Mock location app detected');
      if (flags_data['rooted']) flags.push('Rooted device');
    }
    return flags;
  }

  private async persistFraudSignals(
    workerId: string,
    behavioralFlags: string[],
    networkFlags: string[],
    totalScore: number,
  ) {
    const severity: FraudSeverity = totalScore > 70 ? FraudSeverity.HIGH : FraudSeverity.MEDIUM;
    const allFlags = [...behavioralFlags, ...networkFlags];
    if (allFlags.length === 0) return;

    await this.prisma.fraudSignal.create({
      data: {
        workerId,
        signalType: 'MULTI_SIGNAL',
        severity,
        metadata: { behavioralFlags, networkFlags, totalScore },
      },
    });
  }
}
