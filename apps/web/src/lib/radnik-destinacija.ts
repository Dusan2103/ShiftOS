import type { PrijavljenKorisnik } from './auth-store';

export function odrediRadnikOdrediste(korisnik: PrijavljenKorisnik): '/terminal' | '/moj-profil' {
  return korisnik.radnikId ? '/moj-profil' : '/terminal';
}
