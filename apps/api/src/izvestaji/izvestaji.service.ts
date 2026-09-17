import { Injectable } from '@nestjs/common';
import { IshodZadatka, IzvestajSektoraDTO } from '@shiftos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { izracunajPokrivenostPct } from './pokrivenost-perioda.util';

@Injectable()
export class IzvestajiService {
  constructor(private readonly prisma: PrismaService) {}

  async izvestaj(od: Date, doDatuma: Date): Promise<IzvestajSektoraDTO[]> {
    const sektori = await this.prisma.sektor.findMany({
      orderBy: { naziv: 'asc' },
      include: {
        posete: {
          where: {
            vremeUlaska: { lt: doDatuma },
            OR: [{ vremeIzlaska: null }, { vremeIzlaska: { gt: od } }],
          },
          include: { zadatak: true },
        },
      },
    });

    return sektori.map((s) => {
      const pokrivenostPct = izracunajPokrivenostPct(s.posete, s.minimum, od, doDatuma);

      const zavrseniZadaci = s.posete
        .map((p) => p.zadatak)
        .filter((z): z is NonNullable<typeof z> => !!z && z.ishod != null);

      const uspesni = zavrseniZadaci.filter((z) => z.ishod === IshodZadatka.USPESNO).length;
      const stopaUspesnostiPct =
        zavrseniZadaci.length > 0 ? (uspesni / zavrseniZadaci.length) * 100 : 0;

      const odstupanja = zavrseniZadaci
        .filter((z) => z.stvarnoTrajanje != null)
        .map((z) => (z.stvarnoTrajanje as number) - z.ocekivanoTrajanje);
      const prosecnoOdstupanjeMin =
        odstupanja.length > 0
          ? odstupanja.reduce((a, b) => a + b, 0) / odstupanja.length
          : 0;

      return {
        sektorId: s.id,
        naziv: s.naziv,
        pokrivenostPct: Math.round(pokrivenostPct * 10) / 10,
        brojZadataka: zavrseniZadaci.length,
        stopaUspesnostiPct: Math.round(stopaUspesnostiPct * 10) / 10,
        prosecnoOdstupanjeMin: Math.round(prosecnoOdstupanjeMin * 10) / 10,
      };
    });
  }
}
