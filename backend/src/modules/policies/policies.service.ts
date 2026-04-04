import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreatePolicyDto, QuotePremiumDto } from './dto/policy.dto';
import { PolicyStatus, PolicyTier } from '@prisma/client';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async quote(workerId: string, dto: QuotePremiumDto) {
    const result = await this.pricingService.calculatePremium({
      workerId,
      city: dto.city,
      zones: [],
      weeklyBaseEarning: dto.weeklyBaseEarning,
      avgHoursPerDay: dto.avgHoursPerDay,
      workingDaysPerWeek: dto.workingDaysPerWeek,
      platform: dto.platform,
      historicalClaims: 0,
      tier: dto.tier,
    });
    return result;
  }

  async create(userId: string, dto: CreatePolicyDto) {
    // Get worker profile
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found. Complete onboarding first.');

    // Check no active policy exists
    const activePolicy = await this.prisma.policy.findFirst({
      where: { workerId: worker.id, status: PolicyStatus.ACTIVE },
    });
    if (activePolicy) {
      throw new BadRequestException('An active policy already exists for this week');
    }

    // Get historical claim count
    const claimCount = await this.prisma.claim.count({ where: { workerId: worker.id } });

    // Compute pricing
    const pricing = await this.pricingService.calculatePremium({
      workerId: worker.id,
      city: worker.city,
      zones: worker.zones,
      weeklyBaseEarning: Number(worker.weeklyBaseEarning),
      avgHoursPerDay: worker.avgHoursPerDay,
      workingDaysPerWeek: worker.workingDaysPerWeek,
      platform: worker.platform,
      historicalClaims: claimCount,
      tier: dto.tier,
    });

    // Compute week window (Mon–Sun)
    const weekStart = this.getMonday(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const policy = await this.prisma.policy.create({
      data: {
        workerId: worker.id,
        tier: dto.tier,
        weeklyPremium: pricing.weeklyPremium,
        minPayout: pricing.minPayout,
        maxPayout: pricing.maxPayout,
        status: PolicyStatus.ACTIVE,
        weekStart,
        weekEnd,
        premiumPaidAt: new Date(),
      },
    });

    this.logger.log(`Policy created for worker ${worker.id}: ${dto.tier} @ ₹${pricing.weeklyPremium}/week`);
    return policy;
  }

  async getMyPolicies(userId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    return this.prisma.policy.findMany({
      where: { workerId: worker.id },
      orderBy: { createdAt: 'desc' },
      include: {
        claims: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  async getActivePolicy(workerId: string) {
    return this.prisma.policy.findFirst({
      where: { workerId, status: PolicyStatus.ACTIVE },
      include: { claims: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });
  }

  async cancelPolicy(userId: string, policyId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker not found');

    const policy = await this.prisma.policy.findFirst({
      where: { id: policyId, workerId: worker.id },
    });
    if (!policy) throw new NotFoundException('Policy not found');

    return this.prisma.policy.update({
      where: { id: policyId },
      data: { status: PolicyStatus.CANCELLED, autoRenew: false },
    });
  }

  // ── Insurer endpoints ──────────────────────────────────────

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [policies, total] = await Promise.all([
      this.prisma.policy.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { worker: { select: { name: true, city: true, platform: true } } },
      }),
      this.prisma.policy.count(),
    ]);
    return { data: policies, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Utility ────────────────────────────────────────────────

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
