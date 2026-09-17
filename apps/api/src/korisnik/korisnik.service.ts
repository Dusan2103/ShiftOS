import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StatusNaloga, Uloga } from '@shiftos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { generisiEmail } from './generisi-email.util';

const KORISNIK_JAVNI_PRIKAZ = {
  id: true,
  email: true,
  uloga: true,
  status: true,
  createdAt: true,
} satisfies Prisma.KorisnikSelect;

@Injectable()
export class KorisnikService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async registrujRadnika(ime: string, prezime: string, lozinka: string) {
    const lozinkaHash = await this.auth.heshirajLozinku(lozinka);

    for (let pokusaj = 0; pokusaj < 5; pokusaj++) {
      const email = generisiEmail(ime, prezime);
      try {
        return await this.prisma.$transaction(async (tx) => {
          const radnik = await tx.radnik.create({ data: { ime: `${ime} ${prezime}`.trim() } });
          return tx.korisnik.create({
            data: {
              email,
              lozinkaHash,
              uloga: Uloga.RADNIK,
              status: StatusNaloga.NA_CEKANJU,
              radnikId: radnik.id,
            },
            select: KORISNIK_JAVNI_PRIKAZ,
          });
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
        throw e;
      }
    }
    throw new ConflictException('Nije moguće generisati jedinstven email — pokušajte ponovo.');
  }

  async kreirajNadzornika(ime: string, prezime: string, lozinka: string) {
    const lozinkaHash = await this.auth.heshirajLozinku(lozinka);

    for (let pokusaj = 0; pokusaj < 5; pokusaj++) {
      const email = generisiEmail(ime, prezime);
      try {
        return await this.prisma.korisnik.create({
          data: { email, lozinkaHash, uloga: Uloga.NADZORNIK, status: StatusNaloga.AKTIVAN },
          select: KORISNIK_JAVNI_PRIKAZ,
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
        throw e;
      }
    }
    throw new ConflictException('Nije moguće generisati jedinstven email — pokušajte ponovo.');
  }

  naCekanju() {
    return this.prisma.korisnik.findMany({
      where: { uloga: Uloga.RADNIK, status: StatusNaloga.NA_CEKANJU },
      select: { ...KORISNIK_JAVNI_PRIKAZ, radnik: { select: { ime: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async odobri(id: string) {
    await this.nadjiRadnickiZahtev(id);
    return this.prisma.korisnik.update({
      where: { id },
      data: { status: StatusNaloga.AKTIVAN },
      select: KORISNIK_JAVNI_PRIKAZ,
    });
  }

  async odbij(id: string) {
    await this.nadjiRadnickiZahtev(id);
    return this.prisma.korisnik.update({
      where: { id },
      data: { status: StatusNaloga.ODBIJEN },
      select: KORISNIK_JAVNI_PRIKAZ,
    });
  }

  private async nadjiRadnickiZahtev(id: string) {
    const korisnik = await this.prisma.korisnik.findUnique({ where: { id } });
    if (!korisnik || korisnik.uloga !== Uloga.RADNIK) {
      throw new NotFoundException('Zahtev za nalog nije pronađen');
    }
    return korisnik;
  }

  nadzornici() {
    return this.prisma.korisnik.findMany({
      where: { uloga: Uloga.NADZORNIK },
      select: KORISNIK_JAVNI_PRIKAZ,
      orderBy: { createdAt: 'desc' },
    });
  }

  async aktivirajNadzornika(id: string) {
    return this.postaviStatusNadzornika(id, StatusNaloga.AKTIVAN);
  }

  async deaktivirajNadzornika(id: string) {
    return this.postaviStatusNadzornika(id, StatusNaloga.DEAKTIVIRAN);
  }

  private async postaviStatusNadzornika(id: string, status: StatusNaloga) {
    const korisnik = await this.prisma.korisnik.findUnique({ where: { id } });
    if (!korisnik || korisnik.uloga !== Uloga.NADZORNIK) {
      throw new NotFoundException('Nadzornik nije pronađen');
    }
    return this.prisma.korisnik.update({ where: { id }, data: { status }, select: KORISNIK_JAVNI_PRIKAZ });
  }
}
