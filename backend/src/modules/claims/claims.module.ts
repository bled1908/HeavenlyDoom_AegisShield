import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ClaimsController } from './claims.controller';
import { ClaimsService, ClaimsProcessor } from './claims.service';
import { FraudModule } from '../fraud/fraud.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'claims' }),
    FraudModule,
    PayoutsModule,
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService, ClaimsProcessor],
  exports: [ClaimsService],
})
export class ClaimsModule {}
