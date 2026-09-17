import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KreirajRadnikaDto, IzmeniRadnikaDto } from './dto/radnik.dto';

@Injectable()
export class RadnikService {
  constructor(private readonly prisma: PrismaService) {}

  najdiSve() {
    return this.prisma.radnik.findMany({
      include: { kvalifikacije: { include: { kvalifikacija: true } } },
      orderBy: { ime: 'asc' },
    });
  }

  najdiJedan(id: string) {
    return this.prisma.radnik.findUniqueOrThrow({
      where: { id },
      include: { kvalifikacije: { include: { kvalifikacija: true } } },
    });
  }

  kreiraj(dto: KreirajRadnikaDto) {
    return this.prisma.radnik.create({ data: dto });
  }

  izmeni(id: string, dto: IzmeniRadnikaDto) {
    return this.prisma.radnik.update({ where: { id }, data: dto });
  }

  obrisi(id: string) {
    return this.prisma.radnik.delete({ where: { id } });
  }

  postaviNfcTag(id: string, nfcTagId: string | null) {
    return this.prisma.radnik.update({ where: { id }, data: { nfcTagId } });
  }

  dodeliKvalifikaciju(radnikId: string, kvalifikacijaId: string) {
    return this.prisma.radnikKvalifikacija.upsert({
      where: { radnikId_kvalifikacijaId: { radnikId, kvalifikacijaId } },
      create: { radnikId, kvalifikacijaId },
      update: {},
    });
  }

  oduzmiKvalifikaciju(radnikId: string, kvalifikacijaId: string) {
    return this.prisma.radnikKvalifikacija.delete({
      where: { radnikId_kvalifikacijaId: { radnikId, kvalifikacijaId } },
    });
  }

  async istorija(radnikId: string, od?: Date, doDatuma?: Date) {
    const pocetak = od ?? new Date(new Date().setHours(0, 0, 0, 0));
    const kraj = doDatuma ?? new Date();

    return this.prisma.poseta.findMany({
      where: {
        radnikId,
        vremeUlaska: { gte: pocetak, lte: kraj },
      },
      include: { sektor: true, zadatak: true },
      orderBy: { vremeUlaska: 'asc' },
    });
  }
}
