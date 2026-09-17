import { RazlogOdbijanja } from '../enums';
import { KontrolaPristupaIzlaz, KontrolaPristupaUlaz } from '../types';

export function pokusajUlaska(ulaz: KontrolaPristupaUlaz): KontrolaPristupaIzlaz {
  const imaKvalifikaciju = ulaz.radnikKvalifikacijeIds.includes(
    ulaz.sektor.potrebnaKvalifikacijaId,
  );
  if (!imaKvalifikaciju) {
    return { odobreno: false, razlog: RazlogOdbijanja.NEDOSTAJE_KVALIFIKACIJA };
  }

  if (ulaz.brojTrenutnoUSektoru >= ulaz.sektor.kapacitet) {
    return { odobreno: false, razlog: RazlogOdbijanja.KAPACITET_POPUNJEN };
  }

  return { odobreno: true };
}
