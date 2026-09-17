import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Uloga } from '@shiftos/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TerminalService } from './terminal.service';
import { RegistrujTerminalDto, IzmeniTerminalDto } from './dto/terminal.dto';

@ApiTags('terminali')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('terminali')
export class TerminalController {
  constructor(private readonly service: TerminalService) {}

  @Post()
  registruj(@Body() dto: RegistrujTerminalDto) {
    return this.service.registruj(dto);
  }

  @Get()
  @Roles(Uloga.NADZORNIK, Uloga.ADMINISTRATOR)
  najdiSve() {
    return this.service.najdiSve();
  }

  @Get(':id')
  najdiJedan(@Param('id') id: string) {
    return this.service.najdiJedan(id);
  }

  @Put(':id')
  @Roles(Uloga.ADMINISTRATOR)
  izmeni(@Param('id') id: string, @Body() dto: IzmeniTerminalDto) {
    return this.service.izmeni(id, dto);
  }

  @Delete(':id')
  @Roles(Uloga.ADMINISTRATOR)
  obrisi(@Param('id') id: string) {
    return this.service.obrisi(id);
  }
}
