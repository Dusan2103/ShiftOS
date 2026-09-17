import { FIKSNI_PRAG_MINUTA, oceniIzlazak, praznaStatistika } from '@shiftos/shared';
import { Rng, gaussov } from './rng';

export interface SektorProfil {
  naziv: string;
  prosek: number;
  stdev: number;
}

export const SEKTORI_PROFIL: SektorProfil[] = [
  { naziv: 'Kontrola kvaliteta (niska varijabilnost)', prosek: 20, stdev: 2 },
  { naziv: 'Pakovanje (srednja varijabilnost)', prosek: 15, stdev: 4 },
  { naziv: 'Prijem robe (srednja varijabilnost)', prosek: 18, stdev: 4.5 },
  { naziv: 'Skladištenje (visoka varijabilnost)', prosek: 28, stdev: 9 },
  { naziv: 'Utovar (visoka varijabilnost)', prosek: 22, stdev: 7 },
];

const POSETA_PO_SEKTORU = 150;
const STOPA_PRAVIH_ANOMALIJA = 0.08;
const FAKTOR_ANOMALIJE_MIN = 3;
const FAKTOR_ANOMALIJE_MAX = 6;

export interface UzorakH2 {
  trajanje: number;
  pravaAnomalija: boolean;
}

export interface MatricaKonfuzije {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  preciznost: number;
  odziv: number;
  f1: number;
}

export interface RezultatSektoraH2 {
  naziv: string;
  brojUzoraka: number;
  brojPravihAnomalija: number;
  zScore: MatricaKonfuzije;
  fiksniPrag: MatricaKonfuzije;
}

export interface RezultatH2 {
  poSektoru: RezultatSektoraH2[];
  ukupnoZScore: MatricaKonfuzije;
  ukupnoFiksniPrag: MatricaKonfuzije;
  hipotezaPotvrdjena: boolean;
}

export function generisiUzorkeSektora(
  rng: Rng,
  profil: SektorProfil,
  n: number,
): UzorakH2[] {
  const uzorci: UzorakH2[] = [];
  for (let i = 0; i < n; i++) {
    const pravaAnomalija = rng() < STOPA_PRAVIH_ANOMALIJA;
    let trajanje: number;
    if (pravaAnomalija) {
      const faktor =
        FAKTOR_ANOMALIJE_MIN + rng() * (FAKTOR_ANOMALIJE_MAX - FAKTOR_ANOMALIJE_MIN);
      trajanje = profil.prosek * faktor;
    } else {
      trajanje = Math.max(1, gaussov(rng, profil.prosek, profil.stdev));
    }
    uzorci.push({ trajanje, pravaAnomalija });
  }
  return uzorci;
}

function oceniZScoreMetod(uzorci: UzorakH2[]): boolean[] {
  let stat = praznaStatistika();
  const predikcije: boolean[] = [];
  for (const u of uzorci) {
    const { rezultat, novaStatistika } = oceniIzlazak(u.trajanje, stat);
    stat = novaStatistika;

    predikcije.push(rezultat.ocenjeno ? rezultat.anomalija : false);
  }
  return predikcije;
}

function oceniFiksniPragMetod(uzorci: UzorakH2[]): boolean[] {
  return uzorci.map((u) => u.trajanje > FIKSNI_PRAG_MINUTA);
}

function izracunajMatricu(prave: boolean[], predikcije: boolean[]): MatricaKonfuzije {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (let i = 0; i < prave.length; i++) {
    if (predikcije[i] && prave[i]) tp++;
    else if (predikcije[i] && !prave[i]) fp++;
    else if (!predikcije[i] && prave[i]) fn++;
    else tn++;
  }
  const preciznost = tp + fp > 0 ? tp / (tp + fp) : 0;
  const odziv = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = preciznost + odziv > 0 ? (2 * preciznost * odziv) / (preciznost + odziv) : 0;
  return { tp, fp, fn, tn, preciznost, odziv, f1 };
}

function spojiMatrice(matrice: MatricaKonfuzije[]): MatricaKonfuzije {
  const tp = matrice.reduce((s, m) => s + m.tp, 0);
  const fp = matrice.reduce((s, m) => s + m.fp, 0);
  const fn = matrice.reduce((s, m) => s + m.fn, 0);
  const tn = matrice.reduce((s, m) => s + m.tn, 0);
  const preciznost = tp + fp > 0 ? tp / (tp + fp) : 0;
  const odziv = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = preciznost + odziv > 0 ? (2 * preciznost * odziv) / (preciznost + odziv) : 0;
  return { tp, fp, fn, tn, preciznost, odziv, f1 };
}

export function pokreniH2(rng: Rng, profili: SektorProfil[] = SEKTORI_PROFIL): RezultatH2 {
  const poSektoru: RezultatSektoraH2[] = [];

  for (const profil of profili) {
    const uzorci = generisiUzorkeSektora(rng, profil, POSETA_PO_SEKTORU);
    const prave = uzorci.map((u) => u.pravaAnomalija);

    const zScorePredikcije = oceniZScoreMetod(uzorci);
    const fiksniPredikcije = oceniFiksniPragMetod(uzorci);

    poSektoru.push({
      naziv: profil.naziv,
      brojUzoraka: uzorci.length,
      brojPravihAnomalija: prave.filter(Boolean).length,
      zScore: izracunajMatricu(prave, zScorePredikcije),
      fiksniPrag: izracunajMatricu(prave, fiksniPredikcije),
    });
  }

  const ukupnoZScore = spojiMatrice(poSektoru.map((s) => s.zScore));
  const ukupnoFiksniPrag = spojiMatrice(poSektoru.map((s) => s.fiksniPrag));

  return {
    poSektoru,
    ukupnoZScore,
    ukupnoFiksniPrag,
    hipotezaPotvrdjena: ukupnoZScore.f1 > ukupnoFiksniPrag.f1,
  };
}
