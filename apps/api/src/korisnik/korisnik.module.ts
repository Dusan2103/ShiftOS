import { Module } from '@nestjs/common';
import { KorisnikController } from './korisnik.controller';
import { KorisnikService } from './korisnik.service';

@Module({
  controllers: [KorisnikController],
  providers: [KorisnikService],
})
export class KorisnikModule {}
