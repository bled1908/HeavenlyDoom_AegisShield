import { Module } from '@nestjs/common';
import { MlClientModule } from '../../integrations/ml-client/ml-client.module';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [MlClientModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
