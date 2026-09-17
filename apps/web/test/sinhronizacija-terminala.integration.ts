import 'fake-indexeddb/auto';
import { useAuthStore } from '../src/lib/auth-store';
import { db } from '../src/lib/db';
import { sinhronizujRed } from '../src/lib/sync';
import { osveziKes, uskladiPoseteSektora } from '../src/lib/cache-refresh';
import { proveriUlazakLokalno } from '../src/lib/offline-kontrola';

const API = process.env.SHIFTOS_API_URL ?? 'http://localhost:3001';

let prosli = 0;
let pali = 0;

function provera(naziv: string, uslov: boolean, detalj?: unknown) {
  if (uslov) {
    prosli++;
    console.log('  OK   ' + naziv);
  } else {
    pali++;
    console.log('  PAD  ' + naziv + (detalj !== undefined ? '  -> ' + JSON.stringify(detalj) : ''));
  }
}

interface PrijavaOdgovor {
  accessToken: string;
  korisnik: { id: string; email: string; uloga: string; radnikId: string | null };
}

async function zahtev(metod: string, putanja: string, token?: string | null, telo?: unknown) {
  const r = await fetch(API + putanja, {
    method: metod,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: telo ? JSON.stringify(telo) : undefined,
  });
  const tekst = await r.text();
  return { status: r.status, telo: tekst ? JSON.parse(tekst) : null };
}

async function prijava(email: string): Promise<PrijavaOdgovor> {
  const r = await zahtev('POST', '/auth/login', null, { email, lozinka: 'sifra123' });
  return r.telo;
}

async function otvoreneLokalno(sektorId: string) {
  return db.posete.where('sektorId').equals(sektorId).filter((p) => !p.vremeIzlaska).toArray();
}

async function ocistiOtvorenePosete(sektorId: string, token: string) {
  const aktivne = (await zahtev('GET', `/posete/sektor/${sektorId}/aktivne`, token)).telo as { id: string }[];
  for (const poseta of aktivne) {
    await zahtev('POST', '/posete/izlazak', token, { idempotencyKey: crypto.randomUUID(), posetaId: poseta.id });
  }
}

async function main() {
  const terminal = await prijava('terminal@shiftos.rs');
  const nikola = await prijava('nikola@shiftos.rs');
  const nadzornik = await prijava('nadzornik@shiftos.rs');
  useAuthStore.getState().prijaviSe(terminal.accessToken, terminal.korisnik as never);
  const T = terminal.accessToken;

  const sektori = (await zahtev('GET', '/sektori', T)).telo;
  const qc = sektori.find((s: { naziv: string }) => s.naziv === 'Kontrola kvaliteta');
  const pakovanje = sektori.find((s: { naziv: string }) => s.naziv === 'Pakovanje');
  const radnici = (await zahtev('GET', '/radnici', T)).telo;
  const saQc = radnici.filter((r: { kvalifikacije: { kvalifikacijaId: string }[] }) =>
    r.kvalifikacije.some((k) => k.kvalifikacijaId === qc.potrebnaKvalifikacijaId),
  );
  const [W1, W2, W3] = saQc;

  await ocistiOtvorenePosete(qc.id, T);
  await ocistiOtvorenePosete(pakovanje.id, T);

  console.log(`\nSektor "${qc.naziv}", kapacitet ${qc.kapacitet}; radnici: ${W1.ime}, ${W2.ime}, ${W3.ime}\n`);

  console.log('A) Server odbija ulazak koji je terminal lokalno odobrio');
  await osveziKes(qc.id);
  await zahtev('POST', '/posete/ulazak', T, { idempotencyKey: crypto.randomUUID(), radnikId: W1.id, sektorId: qc.id });
  await zahtev('POST', '/posete/ulazak', T, { idempotencyKey: crypto.randomUUID(), radnikId: W2.id, sektorId: qc.id });
  const lokalnaOdluka = await proveriUlazakLokalno(W3.id, qc.id);
  provera('terminal (bez usklađivanja) lokalno odobrava — ne zna za ulaske sa telefona', lokalnaOdluka.odobreno === true);
  await db.posete.add({
    id: crypto.randomUUID(), radnikId: W3.id, radnikIme: W3.ime, sektorId: qc.id,
    vremeUlaska: new Date().toISOString(), idempotencyKeyUlazak: crypto.randomUUID(),
    sinhronizovanoUlazak: 0, sinhronizovanoIzlazak: 0,
  });
  const s1 = await sinhronizujRed();
  provera('sinhronizacija prijavljuje odbijanje na serveru', s1.odbijenoNaServeru === 1, s1);
  provera('provizorni lokalni zapis je uklonjen (nema večnog ponavljanja)', (await db.posete.where('radnikId').equals(W3.id).count()) === 0);
  const s1b = await sinhronizujRed();
  provera('drugi krug sinhronizacije nema šta da šalje', s1b.poslatoUlazaka + s1b.odbijenoNaServeru + s1b.greske === 0, s1b);

  console.log('\nB) Terminal vidi ulaske napravljene mimo njega');
  await uskladiPoseteSektora(qc.id);
  provera('posle usklađivanja lokalni brojač = 2', (await otvoreneLokalno(qc.id)).length === 2, (await otvoreneLokalno(qc.id)).length);
  const posleUsklađivanja = await proveriUlazakLokalno(W3.id, qc.id);
  provera('terminal sada lokalno ODBIJA treći ulazak (kapacitet)', posleUsklađivanja.odobreno === false && posleUsklađivanja.razlog === 'KAPACITET_POPUNJEN', posleUsklađivanja);

  console.log('\nC) Izlazak napravljen mimo terminala');
  const aktivneServer = (await zahtev('GET', `/posete/sektor/${qc.id}/aktivne`, T)).telo;
  const posetaW2 = aktivneServer.find((p: { radnikId: string }) => p.radnikId === W2.id);
  await zahtev('POST', '/posete/izlazak', T, { idempotencyKey: crypto.randomUUID(), posetaId: posetaW2.id });
  await uskladiPoseteSektora(qc.id);
  provera('lokalni brojač pada na 1', (await otvoreneLokalno(qc.id)).length === 1);
  const zapisW2 = await db.posete.get(posetaW2.id);
  provera('zatvoren lokalni zapis se NE šalje ponovo serveru', !!zapisW2 && zapisW2.sinhronizovanoIzlazak === 1, zapisW2);

  console.log('\nD) Terminal odjavljuje radnika koji je ušao mimo njega (NFC kartica)');
  const [otvorenaW1] = (await otvoreneLokalno(qc.id)).filter((p) => p.radnikId === W1.id);
  await db.posete.update(otvorenaW1.id, { vremeIzlaska: new Date().toISOString(), idempotencyKeyIzlazak: crypto.randomUUID() });
  const s2 = await sinhronizujRed();
  provera('izlazak je poslat serveru', s2.poslatoIzlazaka === 1, s2);
  const naServeru = (await zahtev('GET', `/posete/sektor/${qc.id}/aktivne`, T)).telo;
  provera('server više nema otvorenih poseta u sektoru', naServeru.length === 0, naServeru);

  console.log('\nE) Trka: usklađivanje stigne pre nego što sinhronizacija upiše serverski ID');
  const kljuc = crypto.randomUUID();
  const lokalniId = crypto.randomUUID();
  await db.posete.add({
    id: lokalniId, radnikId: W3.id, radnikIme: W3.ime, sektorId: qc.id,
    vremeUlaska: new Date().toISOString(), idempotencyKeyUlazak: kljuc,
    sinhronizovanoUlazak: 0, sinhronizovanoIzlazak: 0,
  });
  await zahtev('POST', '/posete/ulazak', T, { idempotencyKey: kljuc, radnikId: W3.id, sektorId: qc.id });
  await uskladiPoseteSektora(qc.id);
  provera('(stanje trke) privremeno postoje 2 lokalna zapisa za istu posetu', (await otvoreneLokalno(qc.id)).length === 2);
  await sinhronizujRed();
  const posleTrke = await otvoreneLokalno(qc.id);
  provera('posle sinhronizacije ostaje tačno 1 zapis', posleTrke.length === 1, posleTrke.length);
  provera('preživeo je originalni lokalni zapis, sa serverskim ID-jem', !!posleTrke[0] && posleTrke[0].id === lokalniId && !!posleTrke[0].serverPosetaId);

  console.log('\nF) Zaštite na API-ju');
  const N = nikola.accessToken;
  const tudjiUlazak = await zahtev('POST', '/posete/ulazak', N, { idempotencyKey: crypto.randomUUID(), radnikId: W1.id, sektorId: pakovanje.id });
  provera('radnik NE može da prijavi drugog radnika', tudjiUlazak.status === 403, tudjiUlazak.status);
  const svojUlazak = await zahtev('POST', '/posete/ulazak', N, { idempotencyKey: crypto.randomUUID(), radnikId: (nikola.korisnik as { radnikId: string }).radnikId, sektorId: pakovanje.id });
  provera('radnik može da prijavi sebe', svojUlazak.status === 201 && svojUlazak.telo.odobreno === true, svojUlazak);
  const tudjiIzlazak = await zahtev('POST', '/posete/izlazak', N, { idempotencyKey: crypto.randomUUID(), posetaId: posleTrke[0].serverPosetaId });
  provera('radnik NE može da odjavi drugog radnika', tudjiIzlazak.status === 403, tudjiIzlazak.status);
  provera('radnik NE vidi ko je u sektoru', (await zahtev('GET', `/posete/sektor/${qc.id}/aktivne`, N)).status === 403);
  provera('terminal vidi ko je u svom sektoru', (await zahtev('GET', `/posete/sektor/${qc.id}/aktivne`, T)).status === 200);
  provera('nadzornik vidi ko je u sektoru', (await zahtev('GET', `/posete/sektor/${qc.id}/aktivne`, nadzornik.accessToken)).status === 200);
  const svojIzlazak = await zahtev('POST', '/posete/izlazak', N, { idempotencyKey: crypto.randomUUID(), posetaId: svojUlazak.telo.poseta.id });
  provera('radnik može da odjavi sebe', svojIzlazak.status === 201, svojIzlazak.status);

  console.log(`\n${prosli} prošlo, ${pali} palo.`);
  process.exit(pali ? 1 : 0);
}

main().catch((e) => {
  console.error('GREŠKA U TESTU:', e);
  process.exit(1);
});
