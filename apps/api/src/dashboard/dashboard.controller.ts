import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Uloga } from '@shiftos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('kpi')
  kpi() {
    return this.service.kpi();
  }

  @Get('trend')
  trend() {
    return this.service.trend7Dana();
  }

  @Get('dnevnik')
  dnevnik(@Query('limit') limit?: string) {
    return this.service.dnevnik(limit ? Number(limit) : undefined);
  }
}
