import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Uloga } from '@shiftos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IzvestajiService } from './izvestaji.service';

function pocetakPerioda(period: string | undefined): Date {
  const sada = new Date();
  const danas = new Date(sada);
  danas.setHours(0, 0, 0, 0);

  switch (period) {
    case '7dana':
      return new Date(danas.getTime() - 6 * 24 * 60 * 60 * 1000);
    case 'mesec':
      return new Date(danas.getTime() - 29 * 24 * 60 * 60 * 1000);
    case 'danas':
    default:
      return danas;
  }
}

@ApiTags('izvestaji')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
@Controller('izvestaji')
export class IzvestajiController {
  constructor(private readonly service: IzvestajiService) {}

  @Get()
  izvestaj(@Query('period') period?: string, @Query('od') od?: string, @Query('do') doQ?: string) {
    const periodOd = od ? new Date(od) : pocetakPerioda(period);
    const periodDo = doQ ? new Date(doQ) : new Date();
    return this.service.izvestaj(periodOd, periodDo);
  }
}
