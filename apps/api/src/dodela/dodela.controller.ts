import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Uloga } from '@shiftos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { DodelaService } from './dodela.service';
import { KreirajDodeluDto } from './dto/dodela.dto';

@ApiTags('dodele')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dodele')
export class DodelaController {
  constructor(private readonly service: DodelaService) {}

  @Post()
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  kreiraj(@Body() dto: KreirajDodeluDto) {
    return this.service.kreiraj(dto);
  }

  @Get('radnik/:radnikId')
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  zaRadnika(@Param('radnikId') radnikId: string) {
    return this.service.zaRadnika(radnikId, false);
  }

  @Get('sektor/:sektorId')
  zaSektor(@Param('sektorId') sektorId: string, @Query('datum') datum?: string) {
    return this.service.zaSektorIDatum(sektorId, datum ? new Date(datum) : new Date());
  }

  @Get('me')
  moje(@CurrentUser() korisnik: JwtPayload) {
    if (!korisnik.radnikId) {
      throw new ForbiddenException('Nalog nije povezan sa radnikom');
    }
    return this.service.zaRadnika(korisnik.radnikId, true);
  }

  @Delete(':id')
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  obrisi(@Param('id') id: string) {
    return this.service.obrisi(id);
  }
}
