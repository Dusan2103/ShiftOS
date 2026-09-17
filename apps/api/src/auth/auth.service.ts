import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StatusNaloga, Uloga } from '@shiftos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './jwt-payload.interface';

const PORUKA_STATUSA: Partial<Record<StatusNaloga, string>> = {
  [StatusNaloga.NA_CEKANJU]: 'Nalog čeka odobrenje nadzornika ili administratora.',
  [StatusNaloga.ODBIJEN]: 'Zahtev za nalog je odbijen. Obratite se nadzorniku.',
  [StatusNaloga.DEAKTIVIRAN]: 'Nalog je deaktiviran. Obratite se administratoru.',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async prijava(email: string, lozinka: string, izAndroida = false) {
    const korisnik = await this.prisma.korisnik.findUnique({ where: { email } });
    if (!korisnik) {
      throw new UnauthorizedException('Pogrešan email ili lozinka');
    }

    const ispravna = await bcrypt.compare(lozinka, korisnik.lozinkaHash);
    if (!ispravna) {
      throw new UnauthorizedException('Pogrešan email ili lozinka');
    }

    if (korisnik.status !== StatusNaloga.AKTIVAN) {
      throw new ForbiddenException(
        PORUKA_STATUSA[korisnik.status as StatusNaloga] ?? 'Nalog nije aktivan.',
      );
    }

    if (izAndroida && korisnik.uloga === Uloga.ADMINISTRATOR) {
      throw new ForbiddenException(
        'Administrator nalog nije dostupan u Android aplikaciji — koristite veb aplikaciju.',
      );
    }

    const payload: JwtPayload = {
      sub: korisnik.id,
      email: korisnik.email,
      uloga: korisnik.uloga as Uloga,
      radnikId: korisnik.radnikId,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      korisnik: {
        id: korisnik.id,
        email: korisnik.email,
        uloga: korisnik.uloga,
        radnikId: korisnik.radnikId,
      },
    };
  }

  async heshirajLozinku(lozinka: string): Promise<string> {
    return bcrypt.hash(lozinka, 10);
  }
}
