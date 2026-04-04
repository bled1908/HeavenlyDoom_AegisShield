import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ParametricService } from './parametric.service';
import { ParametricController } from './parametric.controller';
import { WeatherModule } from '../../integrations/weather/weather.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'claims' }),
    WeatherModule,
  ],
  controllers: [ParametricController],
  providers: [ParametricService],
  exports: [ParametricService],
})
export class ParametricModule {}
