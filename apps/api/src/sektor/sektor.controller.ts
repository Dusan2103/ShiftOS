import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Uloga } from '@shiftos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SektorService } from './sektor.service';
import { KreirajSektorDto, IzmeniSektorDto, KreirajZadatakSablonDto } from './dto/sektor.dto';

@ApiTags('sektori')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sektori')
export class SektorController {
  constructor(private readonly service: SektorService) {}

  @Get()
  najdiSve() {
    return this.service.najdiSve();
  }

  @Get('pokrivenost')
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  pokrivenost() {
    return this.service.pokrivenostSvihSektora();
  }

  @Get(':id')
  najdiJedan(@Param('id') id: string) {
    return this.service.najdiJedan(id);
  }

  @Get(':id/statistika')
  statistika(@Param('id') id: string) {
    return this.service.statistika(id);
  }

  @Post()
  @Roles(Uloga.ADMINISTRATOR)
  kreiraj(@Body() dto: KreirajSektorDto) {
    return this.service.kreiraj(dto);
  }

  @Put(':id')
  @Roles(Uloga.ADMINISTRATOR)
  izmeni(@Param('id') id: string, @Body() dto: IzmeniSektorDto) {
    return this.service.izmeni(id, dto);
  }

  @Delete(':id')
  @Roles(Uloga.ADMINISTRATOR)
  obrisi(@Param('id') id: string) {
    return this.service.obrisi(id);
  }

  @Post(':id/zadaci')
  @Roles(Uloga.ADMINISTRATOR)
  dodajZadatak(@Param('id') id: string, @Body() dto: KreirajZadatakSablonDto) {
    return this.service.dodajZadatakSablon(id, dto);
  }

  @Delete('zadaci/:zadatakSablonId')
  @Roles(Uloga.ADMINISTRATOR)
  obrisiZadatak(@Param('zadatakSablonId') zadatakSablonId: string) {
    return this.service.obrisiZadatakSablon(zadatakSablonId);
  }
}
