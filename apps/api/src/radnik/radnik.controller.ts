import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
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
import { RadnikService } from './radnik.service';
import { KreirajRadnikaDto, IzmeniRadnikaDto, PostaviNfcTagDto } from './dto/radnik.dto';

@ApiTags('radnici')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('radnici')
export class RadnikController {
  constructor(private readonly service: RadnikService) {}

  @Get()
  najdiSve() {
    return this.service.najdiSve();
  }

  @Get('me')
  mojProfil(@CurrentUser() korisnik: JwtPayload) {
    if (!korisnik.radnikId) {
      throw new ForbiddenException('Nalog nije povezan sa radnikom');
    }
    return this.service.najdiJedan(korisnik.radnikId);
  }

  @Get('me/istorija')
  mojaIstorija(
    @CurrentUser() korisnik: JwtPayload,
    @Query('od') od?: string,
    @Query('do') doDatuma?: string,
  ) {
    if (!korisnik.radnikId) {
      throw new ForbiddenException('Nalog nije povezan sa radnikom');
    }
    return this.service.istorija(
      korisnik.radnikId,
      od ? new Date(od) : undefined,
      doDatuma ? new Date(doDatuma) : undefined,
    );
  }

  @Get(':id')
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  najdiJedan(@Param('id') id: string) {
    return this.service.najdiJedan(id);
  }

  @Get(':id/istorija')
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  istorija(
    @Param('id') id: string,
    @Query('od') od?: string,
    @Query('do') doDatuma?: string,
  ) {
    return this.service.istorija(
      id,
      od ? new Date(od) : undefined,
      doDatuma ? new Date(doDatuma) : undefined,
    );
  }

  @Post()
  @Roles(Uloga.ADMINISTRATOR)
  kreiraj(@Body() dto: KreirajRadnikaDto) {
    return this.service.kreiraj(dto);
  }

  @Put(':id')
  @Roles(Uloga.ADMINISTRATOR)
  izmeni(@Param('id') id: string, @Body() dto: IzmeniRadnikaDto) {
    return this.service.izmeni(id, dto);
  }

  @Delete(':id')
  @Roles(Uloga.ADMINISTRATOR)
  obrisi(@Param('id') id: string) {
    return this.service.obrisi(id);
  }

  @Put(':id/nfc')
  @Roles(Uloga.ADMINISTRATOR)
  postaviNfcTag(@Param('id') id: string, @Body() dto: PostaviNfcTagDto) {
    return this.service.postaviNfcTag(id, dto.nfcTagId);
  }

  @Delete(':id/nfc')
  @Roles(Uloga.ADMINISTRATOR)
  ukloniNfcTag(@Param('id') id: string) {
    return this.service.postaviNfcTag(id, null);
  }

  @Post(':id/kvalifikacije/:kvalifikacijaId')
  @Roles(Uloga.ADMINISTRATOR)
  dodeliKvalifikaciju(
    @Param('id') id: string,
    @Param('kvalifikacijaId') kvalifikacijaId: string,
  ) {
    return this.service.dodeliKvalifikaciju(id, kvalifikacijaId);
  }

  @Delete(':id/kvalifikacije/:kvalifikacijaId')
  @Roles(Uloga.ADMINISTRATOR)
  oduzmiKvalifikaciju(
    @Param('id') id: string,
    @Param('kvalifikacijaId') kvalifikacijaId: string,
  ) {
    return this.service.oduzmiKvalifikaciju(id, kvalifikacijaId);
  }
}
