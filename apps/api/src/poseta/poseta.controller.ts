import { Body, Controller, ForbiddenException, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Uloga } from '@shiftos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PosetaService } from './poseta.service';
import { UlazakDto, IzlazakDto } from './dto/poseta.dto';

@ApiTags('posete')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posete')
export class PosetaController {
  constructor(private readonly service: PosetaService) {}

  @Post('ulazak')
  ulazak(@CurrentUser() korisnik: JwtPayload, @Body() dto: UlazakDto) {
    if (korisnik.uloga === Uloga.RADNIK && korisnik.radnikId && korisnik.radnikId !== dto.radnikId) {
      throw new ForbiddenException('Radnik može da prijavi isključivo sebe');
    }
    return this.service.pokusajUlaskaRadnika(dto);
  }

  @Post('izlazak')
  izlazak(@CurrentUser() korisnik: JwtPayload, @Body() dto: IzlazakDto) {
    const samoRadnik = korisnik.uloga === Uloga.RADNIK && korisnik.radnikId ? korisnik.radnikId : undefined;
    return this.service.izlazakRadnika(dto, samoRadnik);
  }

  @Get('aktivne')
  @UseGuards(RolesGuard)
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  aktivne() {
    return this.service.aktivnePosete();
  }

  @Get('sektor/:sektorId/aktivne')
  aktivneUSektoru(@CurrentUser() korisnik: JwtPayload, @Param('sektorId') sektorId: string) {
    if (korisnik.uloga === Uloga.RADNIK && korisnik.radnikId) {
      throw new ForbiddenException('Nemate ovlašćenje za ovu akciju');
    }
    return this.service.aktivnePoseteUSektoru(sektorId);
  }

  @Get('moja-aktivna')
  mojaAktivna(@CurrentUser() korisnik: JwtPayload, @Query('sektorId') sektorId: string) {
    if (!korisnik.radnikId) return null;
    return this.service.mojaAktivnaPoseta(korisnik.radnikId, sektorId);
  }
}
