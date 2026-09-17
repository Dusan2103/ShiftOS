import {
  KontrolaPristupaIzlaz,
  OcenaIzlaskaIzlaz,
  WelfordStatistika,
  oceniIzlazak,
  pokusajUlaska,
} from '@shiftos/shared';
import { db, CacheZadatakSablon } from './db';

export interface IzabraniZadatak {
  naziv: string;
  ocekivanoTrajanje: number;
}

export async function proveriUlazakLokalno(
  radnikId: string,
  sektorId: string,
): Promise<KontrolaPristupaIzlaz> {
  const [radnik, sektor] = await Promise.all([
    db.radnici.get(radnikId),
    db.sektori.get(sektorId),
  ]);

  if (!radnik || !sektor) {
    throw new Error('Radnik ili sektor nisu keširani lokalno — potrebna je bar jedna oflajn sinhronizacija dok postoji mreža.');
  }

  const brojUSektoru = await db.posete
    .where('sektorId')
    .equals(sektorId)
    .filter((p) => !p.vremeIzlaska)
    .count();

  return pokusajUlaska({
    radnikKvalifikacijeIds: radnik.kvalifikacijeIds,
    sektor: {
      id: sektor.id,
      potrebnaKvalifikacijaId: sektor.potrebnaKvalifikacijaId,
      kapacitet: sektor.kapacitet,
    },
    brojTrenutnoUSektoru: brojUSektoru,
  });
}

export async function izaberiZadatakZaRadnika(
  radnikId: string,
  sektorId: string,
  sabloni: CacheZadatakSablon[],
): Promise<IzabraniZadatak | null> {
  const dodela = await db.dodele
    .where('radnikId')
    .equals(radnikId)
    .filter((d) => d.sektorId === sektorId)
    .first();

  if (dodela) {
    await db.dodele.delete(dodela.id);
    return { naziv: dodela.naziv, ocekivanoTrajanje: dodela.ocekivanoTrajanje };
  }

  if (sabloni.length === 0) return null;
  const sablon = sabloni[Math.floor(Math.random() * sabloni.length)];
  return { naziv: sablon.naziv, ocekivanoTrajanje: sablon.ocekivanoTrajanje };
}

export async function oceniIzlazakLokalno(
  sektorId: string,
  trajanjeMin: number,
): Promise<{ rezultat: OcenaIzlaskaIzlaz; novaStatistika: WelfordStatistika }> {
  const postojeca = await db.statistika.get(sektorId);
  const stat: WelfordStatistika = postojeca ?? { brojUzoraka: 0, prosek: 0, m2: 0 };

  const ishod = oceniIzlazak(trajanjeMin, stat);
  await db.statistika.put({ sektorId, ...ishod.novaStatistika });
  return ishod;
}
