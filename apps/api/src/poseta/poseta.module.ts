import { Module } from '@nestjs/common';
import { PosetaController } from './poseta.controller';
import { PosetaService } from './poseta.service';

@Module({
  controllers: [PosetaController],
  providers: [PosetaService],
  exports: [PosetaService],
})
export class PosetaModule {}
