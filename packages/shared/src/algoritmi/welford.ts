import { WelfordStatistika } from '../types';

export function praznaStatistika(): WelfordStatistika {
  return { brojUzoraka: 0, prosek: 0, m2: 0 };
}

export function azurirajStatistiku(
  stat: WelfordStatistika,
  x: number,
): WelfordStatistika {
  const brojUzoraka = stat.brojUzoraka + 1;
  const delta = x - stat.prosek;
  const prosek = stat.prosek + delta / brojUzoraka;
  const delta2 = x - prosek;
  const m2 = stat.m2 + delta * delta2;
  return { brojUzoraka, prosek, m2 };
}

export function standardnaDevijacija(stat: WelfordStatistika): number {
  if (stat.brojUzoraka === 0) return 0;
  return Math.sqrt(stat.m2 / stat.brojUzoraka);
}
