import * as fs from 'fs';
import * as path from 'path';
import { mulberry32 } from './rng';
import { pokreniH1 } from './h1-kontrola-pristupa';
import { pokreniH2 } from './h2-detekcija-anomalija';

const SEED = 20260914;
const BROJ_SCENARIJA_H1 = 200;

function pct(x: number): string {
  return `${x.toFixed(1)}%`;
}

function frac(x: number): string {
  return x.toFixed(3);
}

function main() {
  const rngH1 = mulberry32(SEED);
  const rezultatH1 = pokreniH1(rngH1, BROJ_SCENARIJA_H1);

  const rngH2 = mulberry32(SEED + 1);
  const rezultatH2 = pokreniH2(rngH2);

  console.log('='.repeat(78));
  console.log('EKSPERIMENT H1 — kontrola pristupa naspram pristupa bez provere');
  console.log('='.repeat(78));
  console.log(`Broj scenarija: ${rezultatH1.brojScenarija}`);
  console.log(
    `Sistem:      odobreno ${rezultatH1.sistem.brojOdobrenih}, kršenja ${rezultatH1.sistem.brojKrsenja} (${pct(rezultatH1.sistem.stopaKrsenjaPct)})`,
  );
  console.log(
    `Bez provere: odobreno ${rezultatH1.bezProvere.brojOdobrenih}, kršenja ${rezultatH1.bezProvere.brojKrsenja} (${pct(rezultatH1.bezProvere.stopaKrsenjaPct)})`,
  );
  console.log(`Hipoteza H1 potvrđena: ${rezultatH1.hipotezaPotvrdjena ? 'DA' : 'NE'}`);

  console.log('');
  console.log('='.repeat(78));
  console.log('EKSPERIMENT H2 — z-vrednost naspram fiksnog praga');
  console.log('='.repeat(78));
  for (const s of rezultatH2.poSektoru) {
    console.log(`\n${s.naziv} (n=${s.brojUzoraka}, pravih anomalija=${s.brojPravihAnomalija})`);
    console.log(
      `  z-vrednost:   preciznost=${frac(s.zScore.preciznost)}  odziv=${frac(s.zScore.odziv)}  F1=${frac(s.zScore.f1)}  (TP=${s.zScore.tp} FP=${s.zScore.fp} FN=${s.zScore.fn})`,
    );
    console.log(
      `  fiksni prag:  preciznost=${frac(s.fiksniPrag.preciznost)}  odziv=${frac(s.fiksniPrag.odziv)}  F1=${frac(s.fiksniPrag.f1)}  (TP=${s.fiksniPrag.tp} FP=${s.fiksniPrag.fp} FN=${s.fiksniPrag.fn})`,
    );
  }
  console.log('\nUKUPNO:');
  console.log(
    `  z-vrednost:   preciznost=${frac(rezultatH2.ukupnoZScore.preciznost)}  odziv=${frac(rezultatH2.ukupnoZScore.odziv)}  F1=${frac(rezultatH2.ukupnoZScore.f1)}`,
  );
  console.log(
    `  fiksni prag:  preciznost=${frac(rezultatH2.ukupnoFiksniPrag.preciznost)}  odziv=${frac(rezultatH2.ukupnoFiksniPrag.odziv)}  F1=${frac(rezultatH2.ukupnoFiksniPrag.f1)}`,
  );
  console.log(`Hipoteza H2 potvrđena: ${rezultatH2.hipotezaPotvrdjena ? 'DA' : 'NE'}`);

  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, 'rezultati.json'),
    JSON.stringify({ seed: SEED, h1: rezultatH1, h2: rezultatH2 }, null, 2),
  );

  const md = generisiMarkdown(rezultatH1, rezultatH2, SEED, BROJ_SCENARIJA_H1);
  fs.writeFileSync(path.join(outDir, 'rezultati.md'), md);

  console.log(`\nRezultati upisani u ${outDir}`);
}

function generisiMarkdown(
  h1: ReturnType<typeof pokreniH1>,
  h2: ReturnType<typeof pokreniH2>,
  seed: number,
  brojScenarijaH1: number,
): string {
  const linije: string[] = [];
  linije.push('# Rezultati eksperimentalne evaluacije (H1, H2)');
  linije.push('');
  linije.push(
    `Generisano automatski pokretanjem \`npm run experiments\` (seed=${seed}, reproduktivno).`,
  );
  linije.push('');
  linije.push('## H1 — kontrola pristupa naspram pristupa bez provere');
  linije.push('');
  linije.push(`Broj simuliranih scenarija: **${brojScenarijaH1}**`);
  linije.push('');
  linije.push('| Pristup | Odobreno ulazaka | Kršenja pravila | Stopa kršenja (među odobrenim) |');
  linije.push('|---|---|---|---|');
  linije.push(
    `| Sistem (ShiftOS algoritam) | ${h1.sistem.brojOdobrenih} | ${h1.sistem.brojKrsenja} | ${pct(h1.sistem.stopaKrsenjaPct)} |`,
  );
  linije.push(
    `| Bez sistemske provere (simulacija) | ${h1.bezProvere.brojOdobrenih} | ${h1.bezProvere.brojKrsenja} | ${pct(h1.bezProvere.stopaKrsenjaPct)} |`,
  );
  linije.push('');
  linije.push(
    `**Hipoteza H1 je ${h1.hipotezaPotvrdjena ? 'POTVRĐENA' : 'OPOVRGNUTA'}** — sistem je u svim scenarijima ostvario ${pct(h1.sistem.stopaKrsenjaPct)} kršenja pravila` +
      `${h1.sistem.brojKrsenja === 0 ? ', dok je pristup bez provere zabeležio ' + pct(h1.bezProvere.stopaKrsenjaPct) + ' kršenja.' : '.'}`,
  );
  linije.push('');
  linije.push('## H2 — z-vrednost naspram fiksnog praga');
  linije.push('');
  linije.push('| Sektor | n | Prave anomalije | Preciznost (z) | Odziv (z) | F1 (z) | Preciznost (fiksni) | Odziv (fiksni) | F1 (fiksni) |');
  linije.push('|---|---|---|---|---|---|---|---|---|');
  for (const s of h2.poSektoru) {
    linije.push(
      `| ${s.naziv} | ${s.brojUzoraka} | ${s.brojPravihAnomalija} | ${frac(s.zScore.preciznost)} | ${frac(s.zScore.odziv)} | ${frac(s.zScore.f1)} | ${frac(s.fiksniPrag.preciznost)} | ${frac(s.fiksniPrag.odziv)} | ${frac(s.fiksniPrag.f1)} |`,
    );
  }
  linije.push(
    `| **Ukupno** | | | ${frac(h2.ukupnoZScore.preciznost)} | ${frac(h2.ukupnoZScore.odziv)} | **${frac(h2.ukupnoZScore.f1)}** | ${frac(h2.ukupnoFiksniPrag.preciznost)} | ${frac(h2.ukupnoFiksniPrag.odziv)} | **${frac(h2.ukupnoFiksniPrag.f1)}** |`,
  );
  linije.push('');
  linije.push(
    `**Hipoteza H2 je ${h2.hipotezaPotvrdjena ? 'POTVRĐENA' : 'OPOVRGNUTA'}** — algoritam zasnovan na z-vrednosti ostvario je ukupan F1=${frac(h2.ukupnoZScore.f1)} naspram F1=${frac(h2.ukupnoFiksniPrag.f1)} za pravilo sa fiksnim pragom.`,
  );
  linije.push('');
  return linije.join('\n');
}

main();
