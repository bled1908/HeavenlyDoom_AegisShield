import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardKPIs() {
    const [
      totalWorkers,
      activePolicies,
      totalClaims,
      pendingClaims,
      escalatedClaims,
      totalPayoutAgg,
      fraudSignalsToday,
    ] = await Promise.all([
      this.prisma.worker.count(),
      this.prisma.policy.count({ where: { status: 'ACTIVE' } }),
      this.prisma.claim.count(),
      this.prisma.claim.count({ where: { status: 'PENDING' } }),
      this.prisma.claim.count({ where: { status: 'ESCALATED' } }),
      this.prisma.payoutLedger.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.fraudSignal.count({
        where: { detectedAt: { gte: new Date(Date.now() - 86_400_000) } },
      }),
    ]);

    const premiumAgg = await this.prisma.policy.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { weeklyPremium: true },
    });

    const totalPayout = Number(totalPayoutAgg._sum.amount ?? 0);
    const totalPremium = Number(premiumAgg._sum.weeklyPremium ?? 0);
    const lossRatio = totalPremium > 0 ? (totalPayout / totalPremium) * 100 : 0;

    return {
      totalWorkers,
      activePolicies,
      totalClaims,
      pendingClaims,
      escalatedClaims,
      totalPayoutAmount: totalPayout,
      weeklyPremiumIncome: totalPremium,
      lossRatio: parseFloat(lossRatio.toFixed(2)),
      fraudSignalsToday,
    };
  }

  async getZoneRiskData() {
    const data = await this.prisma.disruptionEvent.groupBy({
      by: ['zone'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });
    return data.map((d) => ({ zone: d.zone, disruptionCount: d._count.id }));
  }

  async getLossRatioByCityOverTime() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const claims = await this.prisma.claim.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['APPROVED', 'PARTIAL'] },
      },
      select: {
        payoutAmount: true,
        createdAt: true,
        worker: { select: { city: true } },
      },
    });

    // Group by city + day
    const grouped: Record<string, { city: string; date: string; payout: number }> = {};
    for (const claim of claims) {
      const date = claim.createdAt.toISOString().split('T')[0];
      const city = claim.worker.city;
      const key = `${city}-${date}`;
      if (!grouped[key]) grouped[key] = { city, date, payout: 0 };
      grouped[key].payout += Number(claim.payoutAmount ?? 0);
    }

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getRecentFraudAlerts(limit = 10) {
    return this.prisma.fraudSignal.findMany({
      take: limit,
      orderBy: { detectedAt: 'desc' },
      include: { worker: { select: { name: true, city: true, platform: true } } },
    });
  }
}
