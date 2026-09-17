import { Injectable } from '@nestjs/common';
import { DogadjajDTO, KpiDTO, StatusPokrivenosti } from '@shiftos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SektorService } from '../sektor/sektor.service';

function pocetakDanasnjegDana(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sektorService: SektorService,
  ) {}

  async kpi(): Promise<KpiDTO> {
    const danas = pocetakDanasnjegDana();

    const [pokrivenost, zadaciDanas, anomalijaDanas] = await Promise.all([
      this.sektorService.pokrivenostSvihSektora(),
      this.prisma.zadatak.findMany({
        where: { poseta: { vremeUlaska: { gte: danas } } },
        select: { ishod: true },
      }),
      this.prisma.poseta.count({
        where: { vremeUlaska: { gte: danas }, anomalija: true },
      }),
    ]);

    const zavrseni = zadaciDanas.filter((z) => z.ishod !== null);
    const uspesni = zavrseni.filter((z) => z.ishod === 'USPESNO').length;
    const efikasnostPct = zavrseni.length > 0 ? (uspesni / zavrseni.length) * 100 : 0;

    return {
      efikasnostPct: Math.round(efikasnostPct * 10) / 10,
      pokrivenoSektora: pokrivenost.filter((s) => s.status === StatusPokrivenosti.POKRIVEN)
        .length,
      ukupnoSektora: pokrivenost.length,
      zadatakaDanas: zadaciDanas.length,
      anomalijaDanas,
    };
  }

  async trend7Dana(): Promise<{ label: string; value: number }[]> {
    const pre7Dana = new Date(pocetakDanasnjegDana().getTime() - 6 * 24 * 60 * 60 * 1000);

    const zadaci = await this.prisma.zadatak.findMany({
      where: { poseta: { vremeUlaska: { gte: pre7Dana } } },
      select: { poseta: { select: { vremeUlaska: true } } },
    });

    const dani = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
    const brojacPoDanu = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const dan = new Date(pre7Dana.getTime() + i * 24 * 60 * 60 * 1000);
      brojacPoDanu.set(dan.toDateString(), 0);
    }

    for (const z of zadaci) {
      const kljuc = z.poseta.vremeUlaska.toDateString();
      if (brojacPoDanu.has(kljuc)) {
        brojacPoDanu.set(kljuc, (brojacPoDanu.get(kljuc) ?? 0) + 1);
      }
    }

    return Array.from(brojacPoDanu.entries()).map(([datumString, value]) => ({
      label: dani[new Date(datumString).getDay()],
      value,
    }));
  }

  async dnevnik(limit = 50): Promise<DogadjajDTO[]> {
    const dogadjaji = await this.prisma.dogadjajLog.findMany({
      orderBy: { vreme: 'desc' },
      take: limit,
      include: { radnik: true, sektor: true },
    });

    return dogadjaji.map((d) => ({
      id: d.id,
      tip: d.tip,
      vreme: d.vreme.toISOString(),
      radnikIme: d.radnik?.ime ?? '—',
      sektorNaziv: d.sektor?.naziv ?? '—',
      detalji: d.detalji ?? undefined,
    }));
  }
}
