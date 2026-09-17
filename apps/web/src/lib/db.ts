import Dexie, { type EntityTable } from 'dexie';

export interface LokalnaPoseta {
  id: string;
  radnikId: string;
  radnikIme: string;
  sektorId: string;
  vremeUlaska: string;
  vremeIzlaska?: string;
  zadatakNaziv?: string;
  zadatakOcekivanoTrajanje?: number;
  anomalija?: boolean;
  zScore?: number;

  serverPosetaId?: string;
  idempotencyKeyUlazak: string;
  idempotencyKeyIzlazak?: string;

  sinhronizovanoUlazak: 0 | 1;
  sinhronizovanoIzlazak: 0 | 1;
}

export interface CacheRadnik {
  id: string;
  ime: string;
  kvalifikacijeIds: string[];
  nfcTagId?: string | null;
}

export interface CacheDodela {
  id: string;
  radnikId: string;
  sektorId: string;
  naziv: string;
  ocekivanoTrajanje: number;
}

export interface CacheZadatakSablon {
  naziv: string;
  ocekivanoTrajanje: number;
}

export interface CacheSektor {
  id: string;
  naziv: string;
  potrebnaKvalifikacijaId: string;
  minimum: number;
  kapacitet: number;
  zadaciSabloni: CacheZadatakSablon[];
}

export interface CacheStatistika {
  sektorId: string;
  brojUzoraka: number;
  prosek: number;
  m2: number;
}

export interface TerminalPodesavanje {
  id: 'config';

  terminalId: string;
  sektorId: string;
  sektorNaziv: string;
  serverUrl: string;
}

const db = new Dexie('shiftos-terminal') as Dexie & {
  posete: EntityTable<LokalnaPoseta, 'id'>;
  radnici: EntityTable<CacheRadnik, 'id'>;
  sektori: EntityTable<CacheSektor, 'id'>;
  statistika: EntityTable<CacheStatistika, 'sektorId'>;
  podesavanje: EntityTable<TerminalPodesavanje, 'id'>;
  dodele: EntityTable<CacheDodela, 'id'>;
};

db.version(3).stores({
  posete: 'id, sektorId, radnikId, vremeIzlaska, sinhronizovanoUlazak, sinhronizovanoIzlazak',
  radnici: 'id, ime, nfcTagId',
  sektori: 'id',
  statistika: 'sektorId',
  podesavanje: 'id',
  dodele: 'id, radnikId, sektorId',
});

export { db };
