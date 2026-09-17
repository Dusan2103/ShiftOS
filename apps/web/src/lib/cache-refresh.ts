import { api } from './api';
import { db } from './db';

interface RadnikOdgovor {
  id: string;
  ime: string;
  nfcTagId: string | null;
  kvalifikacije: { kvalifikacijaId: string }[];
}

interface SektorOdgovor {
  id: string;
  naziv: string;
  potrebnaKvalifikacijaId: string;
  minimum: number;
  kapacitet: number;
  zadaciSabloni: { naziv: string; ocekivanoTrajanje: number }[];
}

interface StatistikaOdgovor {
  sektorId: string;
  brojUzoraka: number;
  prosek: number;
  m2: number;
}

interface DodelaOdgovor {
  id: string;
  radnikId: string;
  sektorId: string;
  naziv: string;
  ocekivanoTrajanje: number;
}

interface AktivnaPosetaOdgovor {
  id: string;
  radnikId: string;
  vremeUlaska: string;
}

export async function uskladiPoseteSektora(sektorId: string): Promise<void> {
  const aktivne = await api.get<AktivnaPosetaOdgovor[]>(`/posete/sektor/${sektorId}/aktivne`);
  const aktivniIds = new Set(aktivne.map((p) => p.id));

  await db.transaction('rw', db.posete, db.radnici, async () => {
    const lokalne = await db.posete.where('sektorId').equals(sektorId).toArray();
    const poznatiServerIds = new Set(lokalne.map((p) => p.serverPosetaId).filter(Boolean));

    for (const lokalna of lokalne) {
      if (lokalna.serverPosetaId && !lokalna.vremeIzlaska && !aktivniIds.has(lokalna.serverPosetaId)) {
        await db.posete.update(lokalna.id, {
          vremeIzlaska: new Date().toISOString(),
          sinhronizovanoIzlazak: 1,
        });
      }
    }

    for (const serverska of aktivne) {
      if (poznatiServerIds.has(serverska.id)) continue;
      const radnik = await db.radnici.get(serverska.radnikId);
      await db.posete.add({
        id: serverska.id,
        radnikId: serverska.radnikId,
        radnikIme: radnik?.ime ?? 'Radnik',
        sektorId,
        vremeUlaska: serverska.vremeUlaska,
        serverPosetaId: serverska.id,
        idempotencyKeyUlazak: `server:${serverska.id}`,
        sinhronizovanoUlazak: 1,
        sinhronizovanoIzlazak: 0,
      });
    }
  });
}

export async function osveziKes(sektorId: string): Promise<void> {
  const [radnici, sektor, statistika, dodele] = await Promise.all([
    api.get<RadnikOdgovor[]>('/radnici'),
    api.get<SektorOdgovor>(`/sektori/${sektorId}`),
    api.get<StatistikaOdgovor>(`/sektori/${sektorId}/statistika`),
    api.get<DodelaOdgovor[]>(`/dodele/sektor/${sektorId}`),
  ]);

  await db.transaction('rw', db.radnici, db.sektori, db.statistika, db.dodele, async () => {
    await db.radnici.clear();
    await db.radnici.bulkAdd(
      radnici.map((r) => ({
        id: r.id,
        ime: r.ime,
        nfcTagId: r.nfcTagId,
        kvalifikacijeIds: r.kvalifikacije.map((k) => k.kvalifikacijaId),
      })),
    );

    await db.sektori.put({
      id: sektor.id,
      naziv: sektor.naziv,
      potrebnaKvalifikacijaId: sektor.potrebnaKvalifikacijaId,
      minimum: sektor.minimum,
      kapacitet: sektor.kapacitet,
      zadaciSabloni: sektor.zadaciSabloni.map((z) => ({
        naziv: z.naziv,
        ocekivanoTrajanje: z.ocekivanoTrajanje,
      })),
    });

    await db.statistika.put(statistika);

    await db.dodele.where('sektorId').equals(sektorId).delete();
    await db.dodele.bulkAdd(
      dodele.map((d) => ({
        id: d.id,
        radnikId: d.radnikId,
        sektorId: d.sektorId,
        naziv: d.naziv,
        ocekivanoTrajanje: d.ocekivanoTrajanje,
      })),
    );
  });

  await uskladiPoseteSektora(sektorId);
}
