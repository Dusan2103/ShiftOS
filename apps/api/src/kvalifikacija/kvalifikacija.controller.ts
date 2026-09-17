import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Uloga } from '@shiftos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { KvalifikacijaService } from './kvalifikacija.service';
import { KreirajKvalifikacijuDto, IzmeniKvalifikacijuDto } from './dto/kvalifikacija.dto';

@ApiTags('kvalifikacije')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kvalifikacije')
export class KvalifikacijaController {
  constructor(private readonly service: KvalifikacijaService) {}

  @Get()
  najdiSve() {
    return this.service.najdiSve();
  }

  @Post()
  @Roles(Uloga.ADMINISTRATOR)
  kreiraj(@Body() dto: KreirajKvalifikacijuDto) {
    return this.service.kreiraj(dto);
  }

  @Put(':id')
  @Roles(Uloga.ADMINISTRATOR)
  izmeni(@Param('id') id: string, @Body() dto: IzmeniKvalifikacijuDto) {
    return this.service.izmeni(id, dto);
  }

  @Delete(':id')
  @Roles(Uloga.ADMINISTRATOR)
  obrisi(@Param('id') id: string) {
    return this.service.obrisi(id);
  }
}
