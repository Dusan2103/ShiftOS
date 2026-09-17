interface IntervalPoseta {
  vremeUlaska: Date;
  vremeIzlaska: Date | null;
}

export function izracunajPokrivenostPct(
  posete: IntervalPoseta[],
  minimum: number,
  periodOd: Date,
  periodDo: Date,
): number {
  const trajanjePerioda = periodDo.getTime() - periodOd.getTime();
  if (trajanjePerioda <= 0) return 0;
  if (minimum === 0) return 100;

  const dogadjaji: { vreme: number; delta: number }[] = [];
  for (const p of posete) {
    const pocetak = Math.max(p.vremeUlaska.getTime(), periodOd.getTime());
    const kraj = Math.min((p.vremeIzlaska ?? periodDo).getTime(), periodDo.getTime());
    if (kraj <= pocetak) continue;
    dogadjaji.push({ vreme: pocetak, delta: 1 });
    dogadjaji.push({ vreme: kraj, delta: -1 });
  }
  dogadjaji.sort((a, b) => a.vreme - b.vreme);

  let trenutno = 0;
  let poslednjeVreme = periodOd.getTime();
  let pokrivenoMs = 0;

  for (const dogadjaj of dogadjaji) {
    if (trenutno >= minimum) {
      pokrivenoMs += dogadjaj.vreme - poslednjeVreme;
    }
    trenutno += dogadjaj.delta;
    poslednjeVreme = dogadjaj.vreme;
  }
  if (trenutno >= minimum) {
    pokrivenoMs += periodDo.getTime() - poslednjeVreme;
  }

  return (pokrivenoMs / trajanjePerioda) * 100;
}
