import { Module } from '@nestjs/common';
import { SektorModule } from '../sektor/sektor.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [SektorModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
