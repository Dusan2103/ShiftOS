import { MIN_UZORAKA, PRAG_ANOMALIJE } from '../constants';
import { OcenaIzlaskaIzlaz, WelfordStatistika } from '../types';
import { azurirajStatistiku, standardnaDevijacija } from './welford';

export function oceniIzlazak(
  trajanjeMin: number,
  stat: WelfordStatistika,
): { rezultat: OcenaIzlaskaIzlaz; novaStatistika: WelfordStatistika } {
  const bezOceneOvajPut = stat.brojUzoraka < MIN_UZORAKA;
  const novaStatistika = azurirajStatistiku(stat, trajanjeMin);

  if (bezOceneOvajPut) {
    return { rezultat: { ocenjeno: false }, novaStatistika };
  }

  const devijacija = standardnaDevijacija(stat);

  const z =
    devijacija === 0
      ? trajanjeMin === stat.prosek
        ? 0
        : Number.POSITIVE_INFINITY
      : (trajanjeMin - stat.prosek) / devijacija;

  const anomalija = z > PRAG_ANOMALIJE;
  return { rezultat: { ocenjeno: true, anomalija, zScore: z }, novaStatistika };
}
