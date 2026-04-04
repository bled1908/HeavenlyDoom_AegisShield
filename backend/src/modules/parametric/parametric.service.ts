import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { WeatherService } from '../../integrations/weather/weather.service';
import { DisruptionSeverity, DisruptionType } from '@prisma/client';

@Injectable()
export class ParametricService {
  private readonly logger = new Logger(ParametricService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly weatherService: WeatherService,
    @InjectQueue('claims') private readonly claimsQueue: Queue,
  ) {}

  // ── Real-time subscription every 15 min ───────────────────────────────────
  @Cron(CronExpression.EVERY_10_MINUTES)
  async pollWeatherTriggers(): Promise<void> {
    this.logger.debug('Polling weather triggers...');

    // Get all distinct cities from active workers
    const cities = await this.prisma.worker.findMany({
      distinct: ['city'],
      select: { city: true },
      where: { policies: { some: { status: 'ACTIVE' } } },
    });

    for (const { city } of cities) {
      try {
        const weather = await this.weatherService.checkCity(city);
        if (weather.isDisruption) {
          await this.createDisruptionEvent({
            zone: city,
            type: DisruptionType.WEATHER,
            severity: weather.severity as DisruptionSeverity,
            title: weather.title,
            description: weather.description,
            source: weather.source,
          });
        }
      } catch (err) {
        this.logger.error(`Weather check failed for ${city}: ${err}`);
      }
    }
  }

  async createMockDisruption(data: {
    zone: string;
    type: DisruptionType;
    severity: DisruptionSeverity;
    title: string;
  }) {
    return this.createDisruptionEvent({ ...data, source: 'manual' });
  }

  private async createDisruptionEvent(data: {
    zone: string;
    type: DisruptionType;
    severity: DisruptionSeverity;
    title: string;
    description?: string;
    source: string;
  }) {
    // Check for existing recent event (dedup within 1h)
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const existing = await this.prisma.disruptionEvent.findFirst({
      where: {
        zone: data.zone,
        type: data.type,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (existing) {
      this.logger.debug(`Duplicate disruption skipped for ${data.zone}`);
      return existing;
    }

    const event = await this.prisma.disruptionEvent.create({
      data: {
        zone: data.zone,
        type: data.type,
        severity: data.severity,
        title: data.title,
        description: data.description,
        source: data.source,
        startTime: new Date(),
        verified: data.source === 'manual' ? true : false,
      },
    });

    this.logger.log(`Disruption event created: ${event.title} in ${event.zone}`);

    // Find all affected workers and enqueue claims
    await this.triggerClaimsForEvent(event.id, data.zone);
    return event;
  }

  private async triggerClaimsForEvent(eventId: string, zone: string): Promise<void> {
    // Find workers with active policies in this zone
    const workers = await this.prisma.worker.findMany({
      where: {
        zones: { has: zone.toLowerCase() },
        policies: { some: { status: 'ACTIVE' } },
      },
      include: {
        policies: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    this.logger.log(`Triggering claims for ${workers.length} workers in zone ${zone}`);

    for (const worker of workers) {
      const policy = worker.policies[0];
      if (!policy) continue;

      // Enqueue claim processing (async, non-blocking)
      await this.claimsQueue.add('process-parametric-claim', {
        workerId: worker.id,
        policyId: policy.id,
        disruptionEventId: eventId,
        weeklyBaseEarning: Number(worker.weeklyBaseEarning),
      });
    }
  }

  async getRecentDisruptions(limit = 20) {
    return this.prisma.disruptionEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { _count: { select: { claims: true } } },
    });
  }
}
