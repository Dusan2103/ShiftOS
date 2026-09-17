import 'fake-indexeddb/auto';
import { useAuthStore } from '../src/lib/auth-store';
import { api, ApiGreska } from '../src/lib/api';

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

async function zahtev(metod: string, putanja: string, token?: string | null, telo?: unknown) {
  const r = await fetch(API + putanja, {
    method: metod,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: telo ? JSON.stringify(telo) : undefined,
  });
  const tekst = await r.text();
  return { status: r.status, telo: tekst ? JSON.parse(tekst) : null };
}

async function main() {
  const admin = (await zahtev('POST', '/auth/login', null, { email: 'admin@shiftos.rs', lozinka: 'sifra123' })).telo;
  const terminal = (await zahtev('POST', '/auth/login', null, { email: 'terminal@shiftos.rs', lozinka: 'sifra123' })).telo;
  const A = admin.accessToken;

  console.log('A) Istekla sesija terminala se sama obnavlja');
  useAuthStore.getState().prijaviSe('istekao.token.xyz', terminal.korisnik);
  const sektori = await api.get<unknown[]>('/sektori');
  provera('zahtev sa isteklim tokenom ipak uspeva (automatska ponovna prijava)', Array.isArray(sektori) && sektori.length > 0);
  provera(
    'u prodavnici je sada novi, ispravan token',
    useAuthStore.getState().accessToken !== 'istekao.token.xyz' && !!useAuthStore.getState().korisnik,
  );

  console.log('\nB) Istekla sesija običnog korisnika vodi na prijavu');
  const nadzornik = (await zahtev('POST', '/auth/login', null, { email: 'nadzornik@shiftos.rs', lozinka: 'sifra123' })).telo;
  useAuthStore.getState().prijaviSe('istekao.token.xyz', nadzornik.korisnik);
  let status = 0;
  try {
    await api.get('/sektori');
  } catch (e) {
    status = e instanceof ApiGreska ? e.status : -1;
  }
  provera('zahtev vraća 401', status === 401, status);
  provera('korisnik je odjavljen (stranice ga šalju na /login)', useAuthStore.getState().korisnik === null);

  console.log('\nC) Pogrešna lozinka pri prijavi ne ulazi u beskonačnu petlju');
  useAuthStore.getState().prijaviSe('istekao.token.xyz', terminal.korisnik);
  let loginStatus = 0;
  try {
    await api.post('/auth/login', { email: 'terminal@shiftos.rs', lozinka: 'pogresna' });
  } catch (e) {
    loginStatus = e instanceof ApiGreska ? e.status : -1;
  }
  provera('pogrešna lozinka vraća 401 bez ponavljanja', loginStatus === 401, loginStatus);

  console.log('\nD) Terminal: promena sektora i brisanje');
  useAuthStore.getState().prijaviSe(terminal.accessToken, terminal.korisnik);
  const pakovanje = (sektori as { naziv: string; id: string }[]).find((s) => s.naziv === 'Pakovanje')!;
  const utovar = (sektori as { naziv: string; id: string }[]).find((s) => s.naziv === 'Utovar')!;
  const registrovan = await api.post<{ id: string; sektorId: string }>('/terminali', { sektorId: pakovanje.id, naziv: 'Test vrata' });
  const promena = await zahtev('PUT', `/terminali/${registrovan.id}`, A, { sektorId: utovar.id });
  provera('admin menja sektor terminala', promena.status === 200 && promena.telo.sektorId === utovar.id, promena.status);
  const procitan = await api.get<{ sektorId: string; sektor: { naziv: string } }>(`/terminali/${registrovan.id}`);
  provera('terminal pri proveri dobija novi sektor', procitan.sektorId === utovar.id && procitan.sektor.naziv === 'Utovar');
  const brisanje = await zahtev('DELETE', `/terminali/${registrovan.id}`, A);
  provera('admin briše terminal', brisanje.status === 200, brisanje.status);
  let s404 = 0;
  try {
    await api.get(`/terminali/${registrovan.id}`);
  } catch (e) {
    s404 = e instanceof ApiGreska ? e.status : -1;
  }
  provera('obrisan terminal vraća 404 (ne 500) — terminal se vraća na podešavanje', s404 === 404, s404);
  provera('izmena nepostojećeg terminala vraća 404', (await zahtev('PUT', '/terminali/nepostoji', A, { sektorId: utovar.id })).status === 404);
  provera('brisanje nepostojećeg terminala vraća 404', (await zahtev('DELETE', '/terminali/nepostoji', A)).status === 404);

  console.log(`\n${prosli} prošlo, ${pali} palo.`);
  process.exit(pali ? 1 : 0);
}

main().catch((e) => {
  console.error('GREŠKA U TESTU:', e);
  process.exit(1);
});
