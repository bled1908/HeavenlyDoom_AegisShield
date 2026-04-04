import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { FraudEngineService } from '../fraud/fraud-engine.service';
import { PayoutsService } from '../payouts/payouts.service';
import { ClaimStatus } from '@prisma/client';

interface ClaimJobData {
  workerId: string;
  policyId: string;
  disruptionEventId: string;
  weeklyBaseEarning: number;
}

@Processor('claims')
@Injectable()
export class ClaimsProcessor {
  private readonly logger = new Logger(ClaimsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fraudEngine: FraudEngineService,
    private readonly payoutsService: PayoutsService,
  ) {}

  @Process('process-parametric-claim')
  async processParametricClaim(job: Job<ClaimJobData>): Promise<void> {
    const { workerId, policyId, disruptionEventId, weeklyBaseEarning } = job.data;

    this.logger.log(`Processing parametric claim for worker ${workerId}`);

    // Check no claim already exists for this combination
    const existing = await this.prisma.claim.findFirst({
      where: { workerId, policyId, disruptionEventId },
    });
    if (existing) {
      this.logger.debug('Claim already exists, skipping');
      return;
    }

    // Simulate income impact (in real system, compare platform-reported hours)
    const disruption = await this.prisma.disruptionEvent.findUnique({ where: { id: disruptionEventId } });
    if (!disruption) return;

    const severityImpact: Record<string, number> = {
      LOW: 0.2, MEDIUM: 0.4, HIGH: 0.6, CRITICAL: 0.8,
    };
    const lossRatio = severityImpact[disruption.severity] ?? 0.4;

    const dailyEarning = weeklyBaseEarning / 7;
    const expectedEarning = parseFloat((dailyEarning * 1).toFixed(2)); // 1 day window
    const actualEarning = parseFloat((expectedEarning * (1 - lossRatio)).toFixed(2));
    const lostEarning = parseFloat((expectedEarning - actualEarning).toFixed(2));

    // Get policy coverage band
    const policy = await this.prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) return;

    // Compute payout (capped by coverage band)
    const rawPayout = lostEarning;
    const payoutAmount = Math.min(
      Math.max(rawPayout, Number(policy.minPayout)),
      Number(policy.maxPayout),
    );

    // Create the claim
    const claim = await this.prisma.claim.create({
      data: {
        workerId,
        policyId,
        disruptionEventId,
        expectedEarning,
        actualEarning,
        lostEarning,
        payoutAmount,
        status: ClaimStatus.PENDING,
      },
    });

    // Run fraud check
    const fraudResult = await this.fraudEngine.evaluate({
      workerId,
      claimId: claim.id,
      zone: disruption.zone,
      disruptionType: disruption.type,
      expectedEarning,
      actualEarning,
      locationLogs: [], // would come from real device telemetry
    });

    // Update claim status based on fraud decision
    let newStatus: ClaimStatus;
    let finalPayout = payoutAmount;

    switch (fraudResult.decision) {
      case 'APPROVE':
        newStatus = ClaimStatus.APPROVED;
        break;
      case 'PARTIAL':
        newStatus = ClaimStatus.PARTIAL;
        finalPayout = payoutAmount * 0.6; // 60% partial payout
        break;
      case 'ESCALATE':
        newStatus = ClaimStatus.ESCALATED;
        finalPayout = 0;
        break;
    }

    await this.prisma.claim.update({
      where: { id: claim.id },
      data: { status: newStatus, payoutAmount: finalPayout },
    });

    // Initiate payout for approved/partial
    if (newStatus === ClaimStatus.APPROVED || newStatus === ClaimStatus.PARTIAL) {
      await this.payoutsService.initiatePayout(claim.id, finalPayout);
    }

    this.logger.log(
      `Claim ${claim.id} processed: status=${newStatus}, payout=₹${finalPayout}, fraud_score=${fraudResult.totalScore.toFixed(0)}`,
    );
  }
}

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('claims') private readonly claimsQueue: Queue,
  ) {}

  async getMyClaims(userId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker not found');

    return this.prisma.claim.findMany({
      where: { workerId: worker.id },
      orderBy: { createdAt: 'desc' },
      include: {
        disruptionEvent: true,
        payout: true,
        policy: { select: { tier: true } },
      },
    });
  }

  async getClaimById(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: { disruptionEvent: true, payout: true, worker: { select: { name: true } } },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    return claim;
  }

  async getAllClaims(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [claims, total] = await Promise.all([
      this.prisma.claim.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          worker: { select: { name: true, city: true } },
          disruptionEvent: true,
          payout: true,
        },
      }),
      this.prisma.claim.count(),
    ]);
    return { data: claims, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.claimsQueue.getWaitingCount(),
      this.claimsQueue.getActiveCount(),
      this.claimsQueue.getCompletedCount(),
      this.claimsQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
}
