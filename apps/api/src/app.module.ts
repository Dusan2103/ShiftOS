import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { KvalifikacijaModule } from './kvalifikacija/kvalifikacija.module';
import { SektorModule } from './sektor/sektor.module';
import { RadnikModule } from './radnik/radnik.module';
import { PosetaModule } from './poseta/poseta.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IzvestajiModule } from './izvestaji/izvestaji.module';
import { DodelaModule } from './dodela/dodela.module';
import { KorisnikModule } from './korisnik/korisnik.module';
import { TerminalModule } from './terminal/terminal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    KvalifikacijaModule,
    SektorModule,
    RadnikModule,
    PosetaModule,
    DashboardModule,
    IzvestajiModule,
    DodelaModule,
    KorisnikModule,
    TerminalModule,
  ],
})
export class AppModule {}
