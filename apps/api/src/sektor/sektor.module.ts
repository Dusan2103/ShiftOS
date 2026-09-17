import { Module } from '@nestjs/common';
import { SektorController } from './sektor.controller';
import { SektorService } from './sektor.service';

@Module({
  controllers: [SektorController],
  providers: [SektorService],
  exports: [SektorService],
})
export class SektorModule {}
