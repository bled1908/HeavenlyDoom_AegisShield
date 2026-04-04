import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkersModule } from './modules/workers/workers.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ParametricModule } from './modules/parametric/parametric.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { AdminModule } from './modules/admin/admin.module';
import { MlClientModule } from './integrations/ml-client/ml-client.module';
import { WeatherModule } from './integrations/weather/weather.module';
import { HealthController } from './health/health.controller';
import { configValidationSchema } from './config/config.validation';

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: configValidationSchema,
      validationOptions: { allowUnknown: false, abortEarly: false },
    }),

    // ── Rate limiting ────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (_config: ConfigService) => ({
        throttlers: [
          { name: 'short', ttl: 1000, limit: 20 },
          { name: 'medium', ttl: 60_000, limit: 200 },
          { name: 'long', ttl: 3_600_000, limit: 2000 },
        ],
      }),
    }),

    // ── Bull Queue (Redis) ────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }),
    }),

    // ── Scheduling ────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Health checks ─────────────────────────────────────────
    TerminusModule,
    HttpModule,

    // ── Core infrastructure modules ───────────────────────────
    PrismaModule,
    MlClientModule,
    WeatherModule,

    // ── Business feature modules ──────────────────────────────
    AuthModule,
    WorkersModule,
    PoliciesModule,
    ClaimsModule,
    PricingModule,
    ParametricModule,
    FraudModule,
    PayoutsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
