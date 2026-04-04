import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const corsOrigins = config.get<string>('CORS_ORIGINS', 'http://localhost:3000');

  // ── Security headers ──────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // ── Global prefix & versioning ────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global validation pipe ────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Swagger / OpenAPI ─────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AegisShield API')
      .setDescription(
        'AI-Powered Parametric Income Insurance for Delivery Workers – REST API',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Authentication & authorization')
      .addTag('workers', 'Worker registration and profile management')
      .addTag('policies', 'Insurance policy lifecycle')
      .addTag('claims', 'Parametric claim processing')
      .addTag('disruptions', 'Disruption event ingestion')
      .addTag('pricing', 'Premium calculation engine')
      .addTag('fraud', 'Fraud detection & signals')
      .addTag('payouts', 'Payout simulation')
      .addTag('admin', 'Insurer / admin dashboard data')
      .addTag('health', 'Service health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(
    `🛡️  AegisShield API running on http://localhost:${port}/api/v1`,
  );
  if (nodeEnv !== 'production') {
    console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
