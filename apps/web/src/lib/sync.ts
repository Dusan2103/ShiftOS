import { api } from './api';
import { db } from './db';

type UlazakOdgovor =
  | { odobreno: true; poseta: { id: string } }
  | { odobreno: false; razlog: string };

interface IzlazakOdgovor {
  poseta: { id: string };
  ocena: { ocenjeno: boolean; anomalija?: boolean; zScore?: number };
}

export async function sinhronizujRed(): Promise<{
  poslatoUlazaka: number;
  poslatoIzlazaka: number;
  odbijenoNaServeru: number;
  greske: number;
}> {
  let poslatoUlazaka = 0;
  let poslatoIzlazaka = 0;
  let odbijenoNaServeru = 0;
  let greske = 0;

  const neposlatiUlasci = await db.posete.where('sinhronizovanoUlazak').equals(0).toArray();

  for (const zapis of neposlatiUlasci) {
    try {
      const odgovor = await api.post<UlazakOdgovor>('/posete/ulazak', {
        idempotencyKey: zapis.idempotencyKeyUlazak,
        radnikId: zapis.radnikId,
        sektorId: zapis.sektorId,
        vremeUlaska: zapis.vremeUlaska,
      });

      if (odgovor.odobreno) {
        const serverPosetaId = odgovor.poseta.id;
        await db.transaction('rw', db.posete, async () => {
          await db.posete
            .filter((p) => p.serverPosetaId === serverPosetaId && p.id !== zapis.id)
            .delete();
          await db.posete.update(zapis.id, { sinhronizovanoUlazak: 1, serverPosetaId });
        });
        poslatoUlazaka++;
      } else {
        await db.posete.delete(zapis.id);
        odbijenoNaServeru++;
      }
    } catch {
      greske++;
    }
  }

  const zaZatvaranje = await db.posete
    .where('sinhronizovanoIzlazak')
    .equals(0)
    .filter((p) => !!p.vremeIzlaska && !!p.serverPosetaId)
    .toArray();

  for (const zapis of zaZatvaranje) {
    try {
      const odgovor = await api.post<IzlazakOdgovor>('/posete/izlazak', {
        idempotencyKey: zapis.idempotencyKeyIzlazak,
        posetaId: zapis.serverPosetaId,
        vremeIzlaska: zapis.vremeIzlaska,
      });

      await db.posete.update(zapis.id, {
        sinhronizovanoIzlazak: 1,
        anomalija: odgovor.ocena.ocenjeno ? odgovor.ocena.anomalija : zapis.anomalija,
        zScore: odgovor.ocena.ocenjeno ? odgovor.ocena.zScore : zapis.zScore,
      });
      poslatoIzlazaka++;
    } catch {
      greske++;
    }
  }

  return { poslatoUlazaka, poslatoIzlazaka, odbijenoNaServeru, greske };
}
