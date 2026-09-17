import { pokusajUlaska } from '@shiftos/shared';
import { Rng } from './rng';

const KVALIFIKACIJA_ID = 'Q';

const VEROVATNOCA_ODOBRENJA_BEZ_PROVERE = 0.7;

export interface ScenarioH1 {
  imaKvalifikaciju: boolean;
  kapacitet: number;
  brojTrenutnoUSektoru: number;
}

export interface MetodaRezultatH1 {
  brojOdobrenih: number;
  brojKrsenja: number;
  stopaKrsenjaPct: number;
}

export interface RezultatH1 {
  brojScenarija: number;
  sistem: MetodaRezultatH1;
  bezProvere: MetodaRezultatH1;
  hipotezaPotvrdjena: boolean;
}

export function generisiScenarijeH1(rng: Rng, n: number): ScenarioH1[] {
  const scenariji: ScenarioH1[] = [];
  for (let i = 0; i < n; i++) {
    const kapacitet = 1 + Math.floor(rng() * 5);

    const brojTrenutnoUSektoru = Math.floor(rng() * (kapacitet + 2));
    const imaKvalifikaciju = rng() < 0.5;
    scenariji.push({ imaKvalifikaciju, kapacitet, brojTrenutnoUSektoru });
  }
  return scenariji;
}

function jeKrsenjePravila(scenario: ScenarioH1): boolean {
  const krsiKvalifikaciju = !scenario.imaKvalifikaciju;
  const krsiKapacitet = scenario.brojTrenutnoUSektoru >= scenario.kapacitet;
  return krsiKvalifikaciju || krsiKapacitet;
}

export function pokreniH1(rng: Rng, brojScenarija = 200): RezultatH1 {
  const scenariji = generisiScenarijeH1(rng, brojScenarija);

  let sistemOdobreno = 0;
  let sistemKrsenja = 0;
  let bezProvereOdobreno = 0;
  let bezProvereKrsenja = 0;

  for (const scenario of scenariji) {
    const odluka = pokusajUlaska({
      radnikKvalifikacijeIds: scenario.imaKvalifikaciju ? [KVALIFIKACIJA_ID] : [],
      sektor: {
        id: 'simulirani-sektor',
        potrebnaKvalifikacijaId: KVALIFIKACIJA_ID,
        kapacitet: scenario.kapacitet,
      },
      brojTrenutnoUSektoru: scenario.brojTrenutnoUSektoru,
    });

    if (odluka.odobreno) {
      sistemOdobreno++;
      if (jeKrsenjePravila(scenario)) sistemKrsenja++;
    }

    const bezProvereOdobrava = rng() < VEROVATNOCA_ODOBRENJA_BEZ_PROVERE;
    if (bezProvereOdobrava) {
      bezProvereOdobreno++;
      if (jeKrsenjePravila(scenario)) bezProvereKrsenja++;
    }
  }

  const sistem: MetodaRezultatH1 = {
    brojOdobrenih: sistemOdobreno,
    brojKrsenja: sistemKrsenja,
    stopaKrsenjaPct: sistemOdobreno > 0 ? (sistemKrsenja / sistemOdobreno) * 100 : 0,
  };
  const bezProvere: MetodaRezultatH1 = {
    brojOdobrenih: bezProvereOdobreno,
    brojKrsenja: bezProvereKrsenja,
    stopaKrsenjaPct:
      bezProvereOdobreno > 0 ? (bezProvereKrsenja / bezProvereOdobreno) * 100 : 0,
  };

  return {
    brojScenarija,
    sistem,
    bezProvere,
    hipotezaPotvrdjena: sistem.brojKrsenja === 0 && bezProvere.brojKrsenja > 0,
  };
}
