import { Module } from '@nestjs/common';
import { IzvestajiController } from './izvestaji.controller';
import { IzvestajiService } from './izvestaji.service';

@Module({
  controllers: [IzvestajiController],
  providers: [IzvestajiService],
})
export class IzvestajiModule {}
