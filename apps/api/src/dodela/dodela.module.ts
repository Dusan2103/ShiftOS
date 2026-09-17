import { Module } from '@nestjs/common';
import { DodelaController } from './dodela.controller';
import { DodelaService } from './dodela.service';

@Module({
  controllers: [DodelaController],
  providers: [DodelaService],
  exports: [DodelaService],
})
export class DodelaModule {}
