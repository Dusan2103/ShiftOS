import { IshodZadatka, RazlogOdbijanja, StatusPokrivenosti, Uloga } from './enums';

export interface KvalifikacijaDTO {
  id: string;
  naziv: string;
}

export interface SektorDTO {
  id: string;
  naziv: string;
  potrebnaKvalifikacijaId: string;
  potrebnaKvalifikacija?: KvalifikacijaDTO;
  minimum: number;
  kapacitet: number;
}

export interface RadnikDTO {
  id: string;
  ime: string;
  kvalifikacije: KvalifikacijaDTO[];
}

export interface ZadatakDTO {
  id: string;
  posetaId: string;
  naziv: string;
  ocekivanoTrajanje: number;
  stvarnoTrajanje: number | null;
  ishod: IshodZadatka | null;
}

export interface PosetaDTO {
  id: string;
  radnikId: string;
  sektorId: string;
  vremeUlaska: string;
  vremeIzlaska: string | null;
  anomalija: boolean;
  zScore: number | null;
  zadatak?: ZadatakDTO | null;
}

export interface KorisnikDTO {
  id: string;
  email: string;
  uloga: Uloga;
  radnikId: string | null;
}

export interface KontrolaPristupaUlaz {
  radnikKvalifikacijeIds: string[];
  sektor: Pick<SektorDTO, 'id' | 'potrebnaKvalifikacijaId' | 'kapacitet'>;
  brojTrenutnoUSektoru: number;
}

export type KontrolaPristupaIzlaz =
  | { odobreno: true }
  | { odobreno: false; razlog: RazlogOdbijanja };

export interface WelfordStatistika {
  brojUzoraka: number;
  prosek: number;
  m2: number;
}

export type OcenaIzlaskaIzlaz =
  | { ocenjeno: false }
  | { ocenjeno: true; anomalija: boolean; zScore: number };

export interface SektorPokrivenostDTO {
  sektorId: string;
  naziv: string;
  minimum: number;
  kapacitet: number;
  trenutnoPrisutnih: number;
  status: StatusPokrivenosti;
}

export interface KpiDTO {
  efikasnostPct: number;
  pokrivenoSektora: number;
  ukupnoSektora: number;
  zadatakaDanas: number;
  anomalijaDanas: number;
}

export interface DogadjajDTO {
  id: string;
  tip: string;
  vreme: string;
  radnikIme: string;
  sektorNaziv: string;
  detalji?: string;
}

export interface IzvestajSektoraDTO {
  sektorId: string;
  naziv: string;
  pokrivenostPct: number;
  brojZadataka: number;
  stopaUspesnostiPct: number;
  prosecnoOdstupanjeMin: number;
}

export interface UlazakZahtev {
  idempotencyKey: string;
  radnikId: string;
  sektorId: string;
  vremeUlaska: string;
}

export interface IzlazakZahtev {
  idempotencyKey: string;
  posetaId: string;
  vremeIzlaska: string;
}
