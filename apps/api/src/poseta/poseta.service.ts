import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ZadatakSablon } from '@prisma/client';
import {
  FAKTOR_USPESNOSTI,
  IshodZadatka,
  OcenaIzlaskaIzlaz,
  RazlogOdbijanja,
  TipDogadjaja,
  WelfordStatistika,
  oceniIzlazak,
  pokusajUlaska,
} from '@shiftos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UlazakDto, IzlazakDto } from './dto/poseta.dto';
import { pocetakDana } from '../dodela/dan.util';

function izaberiNasumicniZadatak(sabloni: ZadatakSablon[]): ZadatakSablon | null {
  if (sabloni.length === 0) return null;
  const indeks = Math.floor(Math.random() * sabloni.length);
  return sabloni[indeks];
}

export type UlazakRezultat =
  | { odobreno: true; poseta: Prisma.PosetaGetPayload<{ include: { zadatak: true } }> }
  | { odobreno: false; razlog: RazlogOdbijanja };

export type IzlazakRezultat = {
  poseta: Prisma.PosetaGetPayload<{ include: { zadatak: true } }>;
  ocena: OcenaIzlaskaIzlaz;
};

@Injectable()
export class PosetaService {
  constructor(private readonly prisma: PrismaService) {}

  async pokusajUlaskaRadnika(dto: UlazakDto): Promise<UlazakRezultat> {
    const postojeca = await this.prisma.poseta.findUnique({
      where: { idempotencyKeyUlazak: dto.idempotencyKey },
      include: { zadatak: true },
    });
    if (postojeca) {
      return { odobreno: true, poseta: postojeca };
    }

    const radnik = await this.prisma.radnik.findUnique({
      where: { id: dto.radnikId },
      include: { kvalifikacije: true },
    });
    if (!radnik) throw new NotFoundException('Radnik nije pronađen');

    const sektor = await this.prisma.sektor.findUnique({
      where: { id: dto.sektorId },
      include: { zadaciSabloni: true },
    });
    if (!sektor) throw new NotFoundException('Sektor nije pronađen');

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Sektor" WHERE id = ${sektor.id} FOR UPDATE`;

        const vecPostoji = await tx.poseta.findUnique({
          where: { idempotencyKeyUlazak: dto.idempotencyKey },
          include: { zadatak: true },
        });
        if (vecPostoji) {
          return { odobreno: true, poseta: vecPostoji };
        }

        const brojUSektoru = await tx.poseta.count({
          where: { sektorId: sektor.id, vremeIzlaska: null },
        });

        const odluka = pokusajUlaska({
          radnikKvalifikacijeIds: radnik.kvalifikacije.map((k) => k.kvalifikacijaId),
          sektor: {
            id: sektor.id,
            potrebnaKvalifikacijaId: sektor.potrebnaKvalifikacijaId,
            kapacitet: sektor.kapacitet,
          },
          brojTrenutnoUSektoru: brojUSektoru,
        });

        const vremeUlaska = dto.vremeUlaska ? new Date(dto.vremeUlaska) : new Date();

        if (!odluka.odobreno) {
          await tx.dogadjajLog.create({
            data: {
              tip: TipDogadjaja.ULAZAK_ODBIJEN,
              radnikId: radnik.id,
              sektorId: sektor.id,
              detalji: odluka.razlog,
              vreme: vremeUlaska,
            },
          });
          return { odobreno: false, razlog: odluka.razlog };
        }

        const dodela = await tx.zadatakDodela.findFirst({
          where: {
            radnikId: radnik.id,
            sektorId: sektor.id,
            datum: pocetakDana(vremeUlaska),
            izvrseno: false,
          },
        });

        const zadatakInfo = dodela
          ? { naziv: dodela.naziv, ocekivanoTrajanje: dodela.ocekivanoTrajanje }
          : (() => {
              const sablon = izaberiNasumicniZadatak(sektor.zadaciSabloni);
              return sablon ? { naziv: sablon.naziv, ocekivanoTrajanje: sablon.ocekivanoTrajanje } : null;
            })();

        const poseta = await tx.poseta.create({
          data: {
            radnikId: radnik.id,
            sektorId: sektor.id,
            vremeUlaska,
            idempotencyKeyUlazak: dto.idempotencyKey,
            zadatak: zadatakInfo ? { create: zadatakInfo } : undefined,
          },
          include: { zadatak: true },
        });

        if (dodela) {
          await tx.zadatakDodela.update({ where: { id: dodela.id }, data: { izvrseno: true } });
        }

        await tx.dogadjajLog.create({
          data: {
            tip: TipDogadjaja.ULAZAK_ODOBREN,
            radnikId: radnik.id,
            sektorId: sektor.id,
            detalji: poseta.zadatak?.naziv,
            vreme: vremeUlaska,
          },
        });

        return { odobreno: true, poseta };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const poseta = await this.prisma.poseta.findUnique({
          where: { idempotencyKeyUlazak: dto.idempotencyKey },
          include: { zadatak: true },
        });
        if (poseta) return { odobreno: true, poseta };
      }
      throw err;
    }
  }

  async izlazakRadnika(dto: IzlazakDto, samoRadnikId?: string): Promise<IzlazakRezultat> {
    const postojeca = await this.prisma.poseta.findUnique({
      where: { id: dto.posetaId },
      include: { zadatak: true },
    });
    if (!postojeca) throw new NotFoundException('Poseta nije pronađena');
    if (samoRadnikId && postojeca.radnikId !== samoRadnikId) {
      throw new ForbiddenException('Radnik može da odjavi isključivo sebe');
    }

    if (postojeca.idempotencyKeyIzlazak === dto.idempotencyKey) {
      const ocena: OcenaIzlaskaIzlaz =
        postojeca.zScore == null
          ? { ocenjeno: false }
          : { ocenjeno: true, anomalija: postojeca.anomalija, zScore: postojeca.zScore };
      return { poseta: postojeca, ocena };
    }

    if (postojeca.vremeIzlaska) {
      const ocena: OcenaIzlaskaIzlaz =
        postojeca.zScore == null
          ? { ocenjeno: false }
          : { ocenjeno: true, anomalija: postojeca.anomalija, zScore: postojeca.zScore };
      return { poseta: postojeca, ocena };
    }

    const vremeIzlaska = dto.vremeIzlaska ? new Date(dto.vremeIzlaska) : new Date();
    const trajanjeMin = Math.max(
      0,
      (vremeIzlaska.getTime() - postojeca.vremeUlaska.getTime()) / 60000,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "SektorStatistika" WHERE "sektorId" = ${postojeca.sektorId} FOR UPDATE`;

      const svezaPoseta = await tx.poseta.findUniqueOrThrow({
        where: { id: postojeca.id },
        include: { zadatak: true },
      });
      if (svezaPoseta.idempotencyKeyIzlazak === dto.idempotencyKey || svezaPoseta.vremeIzlaska) {
        const ocena: OcenaIzlaskaIzlaz =
          svezaPoseta.zScore == null
            ? { ocenjeno: false }
            : { ocenjeno: true, anomalija: svezaPoseta.anomalija, zScore: svezaPoseta.zScore };
        return { poseta: svezaPoseta, ocena };
      }

      const statRed = await tx.sektorStatistika.upsert({
        where: { sektorId: postojeca.sektorId },
        create: { sektorId: postojeca.sektorId },
        update: {},
      });

      const staraStatistika: WelfordStatistika = {
        brojUzoraka: statRed.brojUzoraka,
        prosek: statRed.prosek,
        m2: statRed.m2,
      };

      const { rezultat, novaStatistika } = oceniIzlazak(trajanjeMin, staraStatistika);

      await tx.sektorStatistika.update({
        where: { sektorId: postojeca.sektorId },
        data: {
          brojUzoraka: novaStatistika.brojUzoraka,
          prosek: novaStatistika.prosek,
          m2: novaStatistika.m2,
        },
      });

      const anomalija = rezultat.ocenjeno && rezultat.anomalija;
      const zScore = rezultat.ocenjeno ? rezultat.zScore : null;

      let ishod: IshodZadatka | undefined;
      const stvarnoTrajanje = Math.round(trajanjeMin);
      if (postojeca.zadatak) {
        ishod =
          stvarnoTrajanje <= postojeca.zadatak.ocekivanoTrajanje * FAKTOR_USPESNOSTI
            ? IshodZadatka.USPESNO
            : IshodZadatka.NEUSPESNO;
      }

      const poseta = await tx.poseta.update({
        where: { id: postojeca.id },
        data: {
          vremeIzlaska,
          anomalija,
          zScore,
          idempotencyKeyIzlazak: dto.idempotencyKey,
          zadatak: postojeca.zadatak
            ? { update: { stvarnoTrajanje, ishod } }
            : undefined,
        },
        include: { zadatak: true },
      });

      await tx.dogadjajLog.create({
        data: {
          tip: TipDogadjaja.IZLAZAK,
          radnikId: poseta.radnikId,
          sektorId: poseta.sektorId,
          detalji: `${stvarnoTrajanje} min`,
          vreme: vremeIzlaska,
        },
      });

      if (anomalija) {
        await tx.dogadjajLog.create({
          data: {
            tip: TipDogadjaja.ANOMALIJA,
            radnikId: poseta.radnikId,
            sektorId: poseta.sektorId,
            detalji: `z=${zScore?.toFixed(2)}, ${stvarnoTrajanje} min`,
            vreme: vremeIzlaska,
          },
        });
      }

      return { poseta, ocena: rezultat };
    });
  }

  aktivnePosete() {
    return this.prisma.poseta.findMany({
      where: { vremeIzlaska: null },
      include: { radnik: true, sektor: true, zadatak: true },
      orderBy: { vremeUlaska: 'asc' },
    });
  }

  aktivnePoseteUSektoru(sektorId: string) {
    return this.prisma.poseta.findMany({
      where: { sektorId, vremeIzlaska: null },
      select: { id: true, radnikId: true, vremeUlaska: true },
    });
  }

  mojaAktivnaPoseta(radnikId: string, sektorId: string) {
    return this.prisma.poseta.findFirst({
      where: { radnikId, sektorId, vremeIzlaska: null },
    });
  }
}
