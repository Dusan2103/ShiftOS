import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KreirajDodeluDto } from './dto/dodela.dto';
import { pocetakDana } from './dan.util';

@Injectable()
export class DodelaService {
  constructor(private readonly prisma: PrismaService) {}

  kreiraj(dto: KreirajDodeluDto) {
    return this.prisma.zadatakDodela.create({
      data: {
        radnikId: dto.radnikId,
        sektorId: dto.sektorId,
        naziv: dto.naziv,
        ocekivanoTrajanje: dto.ocekivanoTrajanje,
        datum: pocetakDana(dto.datum),
      },
      include: { sektor: true },
    });
  }

  zaRadnika(radnikId: string, samoNeizvrsene = true) {
    return this.prisma.zadatakDodela.findMany({
      where: { radnikId, ...(samoNeizvrsene ? { izvrseno: false } : {}) },
      include: { sektor: true },
      orderBy: { datum: 'asc' },
    });
  }

  zaSektorIDatum(sektorId: string, datum: Date) {
    return this.prisma.zadatakDodela.findMany({
      where: { sektorId, datum: pocetakDana(datum), izvrseno: false },
    });
  }

  obrisi(id: string) {
    return this.prisma.zadatakDodela.delete({ where: { id } });
  }
}
