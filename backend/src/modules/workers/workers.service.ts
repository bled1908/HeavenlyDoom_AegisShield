import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MlClientService } from '../../integrations/ml-client/ml-client.service';
import { CreateWorkerDto, UpdateWorkerDto } from './dto/worker.dto';

@Injectable()
export class WorkersService {
  private readonly logger = new Logger(WorkersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClientService,
  ) {}

  async create(userId: string, dto: CreateWorkerDto) {
    const existing = await this.prisma.worker.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Worker profile already exists for this user');

    const existingPhone = await this.prisma.worker.findUnique({ where: { phone: dto.phone } });
    if (existingPhone) throw new ConflictException('Phone number already registered');

    const worker = await this.prisma.worker.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        city: dto.city,
        zones: dto.zones,
        platform: dto.platform,
        weeklyBaseEarning: dto.weeklyBaseEarning,
        avgHoursPerDay: dto.avgHoursPerDay,
        workingDaysPerWeek: dto.workingDaysPerWeek ?? 6,
      },
    });

    // Compute initial risk score from ML service
    try {
      const riskResult = await this.mlClient.getRiskScore({
        workerId: worker.id,
        city: worker.city,
        zones: worker.zones,
        weeklyBaseEarning: Number(worker.weeklyBaseEarning),
        avgHoursPerDay: worker.avgHoursPerDay,
        workingDaysPerWeek: worker.workingDaysPerWeek,
        platform: worker.platform,
        historicalClaims: 0,
        seasonality: this.getCurrentSeason(),
      });

      await this.prisma.worker.update({
        where: { id: worker.id },
        data: { riskScore: riskResult.riskScore },
      });

      return { ...worker, riskScore: riskResult.riskScore };
    } catch (err) {
      this.logger.warn(`ML risk score unavailable for worker ${worker.id}: ${err}`);
      return worker;
    }
  }

  async findByUserId(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      include: {
        policies: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        claims: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { disruptionEvent: true },
        },
      },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');
    return worker;
  }

  async findById(id: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) throw new NotFoundException('Worker not found');
    return worker;
  }

  async update(userId: string, dto: UpdateWorkerDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    return this.prisma.worker.update({
      where: { id: worker.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.zones && { zones: dto.zones }),
        ...(dto.avgHoursPerDay && { avgHoursPerDay: dto.avgHoursPerDay }),
        ...(dto.workingDaysPerWeek && { workingDaysPerWeek: dto.workingDaysPerWeek }),
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [workers, total] = await Promise.all([
      this.prisma.worker.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.worker.count(),
    ]);
    return { data: workers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private getCurrentSeason(): 'MONSOON' | 'SUMMER' | 'WINTER' | 'SPRING' {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 9) return 'MONSOON';
    if (month >= 3 && month <= 5) return 'SUMMER';
    if (month >= 11 || month <= 2) return 'WINTER';
    return 'SPRING';
  }
}
