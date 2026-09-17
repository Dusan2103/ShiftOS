import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Uloga } from '@shiftos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { KorisnikService } from './korisnik.service';
import { RegistracijaRadnikaDto, KreirajNadzornikaDto } from './dto/korisnik.dto';

@ApiTags('korisnici')
@Controller('korisnici')
export class KorisnikController {
  constructor(private readonly service: KorisnikService) {}

  @Post('registracija-radnika')
  registracijaRadnika(@Body() dto: RegistracijaRadnikaDto) {
    return this.service.registrujRadnika(dto.ime, dto.prezime, dto.lozinka);
  }

  @Get('na-cekanju')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  @ApiBearerAuth()
  naCekanju() {
    return this.service.naCekanju();
  }

  @Post(':id/odobri')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  @ApiBearerAuth()
  odobri(@Param('id') id: string) {
    return this.service.odobri(id);
  }

  @Post(':id/odbij')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  @ApiBearerAuth()
  odbij(@Param('id') id: string) {
    return this.service.odbij(id);
  }

  @Get('nadzornici')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Uloga.ADMINISTRATOR)
  @ApiBearerAuth()
  nadzornici() {
    return this.service.nadzornici();
  }

  @Post('nadzornici')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Uloga.ADMINISTRATOR)
  @ApiBearerAuth()
  kreirajNadzornika(@Body() dto: KreirajNadzornikaDto) {
    return this.service.kreirajNadzornika(dto.ime, dto.prezime, dto.lozinka);
  }

  @Post('nadzornici/:id/aktiviraj')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Uloga.ADMINISTRATOR)
  @ApiBearerAuth()
  aktivirajNadzornika(@Param('id') id: string) {
    return this.service.aktivirajNadzornika(id);
  }

  @Post('nadzornici/:id/deaktiviraj')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Uloga.ADMINISTRATOR)
  @ApiBearerAuth()
  deaktivirajNadzornika(@Param('id') id: string) {
    return this.service.deaktivirajNadzornika(id);
  }
}
