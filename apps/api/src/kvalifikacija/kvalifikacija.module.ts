import { Module } from '@nestjs/common';
import { KvalifikacijaController } from './kvalifikacija.controller';
import { KvalifikacijaService } from './kvalifikacija.service';

@Module({
  controllers: [KvalifikacijaController],
  providers: [KvalifikacijaService],
})
export class KvalifikacijaModule {}
