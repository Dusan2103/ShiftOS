import { Injectable } from '@nestjs/common';
import { StatusPokrivenosti, SektorPokrivenostDTO } from '@shiftos/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  KreirajSektorDto,
  IzmeniSektorDto,
  KreirajZadatakSablonDto,
} from './dto/sektor.dto';

@Injectable()
export class SektorService {
  constructor(private readonly prisma: PrismaService) {}

  najdiSve() {
    return this.prisma.sektor.findMany({
      include: { potrebnaKvalifikacija: true, zadaciSabloni: true },
      orderBy: { naziv: 'asc' },
    });
  }

  najdiJedan(id: string) {
    return this.prisma.sektor.findUniqueOrThrow({
      where: { id },
      include: { potrebnaKvalifikacija: true, zadaciSabloni: true },
    });
  }

  async kreiraj(dto: KreirajSektorDto) {
    const sektor = await this.prisma.sektor.create({ data: dto });

    await this.prisma.sektorStatistika.create({ data: { sektorId: sektor.id } });
    return sektor;
  }

  izmeni(id: string, dto: IzmeniSektorDto) {
    return this.prisma.sektor.update({ where: { id }, data: dto });
  }

  obrisi(id: string) {
    return this.prisma.sektor.delete({ where: { id } });
  }

  async statistika(sektorId: string) {
    const s = await this.prisma.sektorStatistika.findUnique({ where: { sektorId } });
    return s ?? { sektorId, brojUzoraka: 0, prosek: 0, m2: 0 };
  }

  dodajZadatakSablon(sektorId: string, dto: KreirajZadatakSablonDto) {
    return this.prisma.zadatakSablon.create({ data: { ...dto, sektorId } });
  }

  obrisiZadatakSablon(id: string) {
    return this.prisma.zadatakSablon.delete({ where: { id } });
  }

  async pokrivenostSvihSektora(): Promise<SektorPokrivenostDTO[]> {
    const sektori = await this.prisma.sektor.findMany({
      orderBy: { naziv: 'asc' },
      include: {
        _count: { select: { posete: { where: { vremeIzlaska: null } } } },
      },
    });

    return sektori.map((s) => {
      const trenutnoPrisutnih = s._count.posete;
      let status: StatusPokrivenosti;
      if (trenutnoPrisutnih === 0) {
        status = s.minimum === 0 ? StatusPokrivenosti.POKRIVEN : StatusPokrivenosti.PRAZAN;
      } else if (trenutnoPrisutnih >= s.minimum) {
        status = StatusPokrivenosti.POKRIVEN;
      } else {
        status = StatusPokrivenosti.NEDOVOLJNO;
      }

      return {
        sektorId: s.id,
        naziv: s.naziv,
        minimum: s.minimum,
        kapacitet: s.kapacitet,
        trenutnoPrisutnih,
        status,
      };
    });
  }
}
