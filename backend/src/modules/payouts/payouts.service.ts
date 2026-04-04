import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayoutStatus } from '@prisma/client';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  async initiatePayout(claimId: string, amount: number): Promise<void> {
    const [prismaModule] = await Promise.all([import('../../prisma/prisma.service')]);
    // Note: PrismaService is injected, avoiding circular dep
    this.logger.log(`Initiating payout for claim ${claimId}: ₹${amount}`);
    // Payout simulation - in production, this calls Razorpay/UPI
    const externalRef = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await this.prisma.payoutLedger.create({
      data: {
        claimId,
        amount,
        method: 'UPI_SIMULATION',
        status: PayoutStatus.QUEUED,
        externalRef,
      },
    });

    // Simulate async processing (in production: webhook from payment gateway)
    setTimeout(async () => {
      try {
        await this.prisma.payoutLedger.update({
          where: { claimId },
          data: { status: PayoutStatus.COMPLETED, processedAt: new Date() },
        });
        this.logger.log(`Payout completed for claim ${claimId}: ref=${externalRef}`);
      } catch (err) {
        this.logger.error(`Payout failed for claim ${claimId}: ${err}`);
        await this.prisma.payoutLedger.update({
          where: { claimId },
          data: { status: PayoutStatus.FAILED, failureReason: String(err) },
        });
      }
    }, 2000);
  }

  constructor(private readonly prisma: PrismaService) {}

  async getPayoutStats() {
    const [total, completed, failed, queued] = await Promise.all([
      this.prisma.payoutLedger.aggregate({ _sum: { amount: true } }),
      this.prisma.payoutLedger.aggregate({
        where: { status: PayoutStatus.COMPLETED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payoutLedger.count({ where: { status: PayoutStatus.FAILED } }),
      this.prisma.payoutLedger.count({ where: { status: PayoutStatus.QUEUED } }),
    ]);
    return {
      totalPayoutAmount: total._sum.amount ?? 0,
      completedPayouts: completed._count,
      completedAmount: completed._sum.amount ?? 0,
      failedPayouts: failed,
      queuedPayouts: queued,
    };
  }
}
