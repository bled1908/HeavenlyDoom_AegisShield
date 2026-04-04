import { Module } from '@nestjs/common';
import { FraudEngineService } from './fraud-engine.service';
import { FraudController } from './fraud.controller';
import { MlClientModule } from '../../integrations/ml-client/ml-client.module';

@Module({
  imports: [MlClientModule],
  controllers: [FraudController],
  providers: [FraudEngineService],
  exports: [FraudEngineService],
})
export class FraudModule {}
