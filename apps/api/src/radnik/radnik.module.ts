import { Module } from '@nestjs/common';
import { RadnikController } from './radnik.controller';
import { RadnikService } from './radnik.service';

@Module({
  controllers: [RadnikController],
  providers: [RadnikService],
  exports: [RadnikService],
})
export class RadnikModule {}
