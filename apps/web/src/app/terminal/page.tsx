'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Wifi, WifiOff, Nfc } from 'lucide-react';
import { RazlogOdbijanja } from '@shiftos/shared';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { api, ApiGreska } from '@/lib/api';
import { db, TerminalPodesavanje } from '@/lib/db';
import { osveziKes, uskladiPoseteSektora } from '@/lib/cache-refresh';
import { proveriUlazakLokalno, izaberiZadatakZaRadnika, oceniIzlazakLokalno } from '@/lib/offline-kontrola';
import { sinhronizujRed } from '@/lib/sync';
import { useAutoSync } from '@/hooks/useAutoSync';
import { postaviTerminalIdNaUredjaju } from '@/lib/platforma';

const RAZLOG_TEKST: Record<RazlogOdbijanja, string> = {
  [RazlogOdbijanja.NEDOSTAJE_KVALIFIKACIJA]: 'radnik nema potrebnu kvalifikaciju za ovaj sektor',
  [RazlogOdbijanja.KAPACITET_POPUNJEN]: 'sektor je popunjen do kapaciteta',
};

interface TerminalOdgovor {
  id: string;
  sektorId: string;
  sektor: { naziv: string };
}

type Poruka =
  | { vrsta: 'odobreno'; tekst: string }
  | { vrsta: 'odbijeno'; tekst: string }
  | { vrsta: 'anomalija'; tekst: string }
  | { vrsta: 'greska'; tekst: string }
  | null;

export default function TerminalStranica() {
  const router = useRouter();
  const { online } = useAutoSync();

  const [config, setConfig] = useState<TerminalPodesavanje | null | undefined>(undefined);
  const [poruka, setPoruka] = useState<Poruka>(null);
  const [nfcStatus, setNfcStatus] = useState<'nedostupan' | 'ceka' | 'greska'>('nedostupan');
  const obradaRef = useRef(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const povratakTajmerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const radnici = useLiveQuery(() => db.radnici.orderBy('ime').toArray(), [], []);
  const trenutnoPrisutnih = useLiveQuery(
    () =>
      config
        ? db.posete
            .where('sektorId')
            .equals(config.sektorId)
            .filter((p) => !p.vremeIzlaska)
            .count()
        : Promise.resolve(0),
    [config],
    0,
  );

  useEffect(() => {
    db.podesavanje.get('config').then((c) => setConfig(c ?? null));
  }, []);

  useEffect(() => {
    if (config === null) router.replace('/terminal/setup');
  }, [config, router]);

  useEffect(() => {
    if (config && online) {
      osveziKes(config.sektorId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, online]);

  useEffect(() => {
    if (!config || !online) return;
    let otkazano = false;

    async function uskladiSaServerom(trenutni: TerminalPodesavanje) {
      try {
        const terminal = await api.get<TerminalOdgovor>(`/terminali/${trenutni.terminalId}`);
        if (otkazano) return;
        if (terminal.sektorId !== trenutni.sektorId || terminal.sektor.naziv !== trenutni.sektorNaziv) {
          const novi = { ...trenutni, sektorId: terminal.sektorId, sektorNaziv: terminal.sektor.naziv };
          await db.podesavanje.put(novi);
          setConfig(novi);
          return;
        }
        await uskladiPoseteSektora(trenutni.sektorId);
      } catch (e) {
        if (!otkazano && e instanceof ApiGreska && e.status === 404) {
          await db.podesavanje.delete('config');
          setConfig(null);
        }
      }
    }

    const interval = setInterval(() => uskladiSaServerom(config), 10_000);
    return () => {
      otkazano = true;
      clearInterval(interval);
    };
  }, [config, online]);

  useEffect(() => {
    if (config) postaviTerminalIdNaUredjaju(config.terminalId);
  }, [config]);

  useEffect(() => {
    if (!config) return;
    let otkazano = false;
    import('qrcode/lib/browser')
      .then(({ toCanvas }) => {
        if (otkazano || !qrCanvasRef.current) return;
        return toCanvas(qrCanvasRef.current, config.terminalId, { width: 260, margin: 1 });
      })
      .catch(() => {});
    return () => {
      otkazano = true;
    };
  }, [config]);

  useEffect(() => () => {
    if (povratakTajmerRef.current) clearTimeout(povratakTajmerRef.current);
  }, []);

  useEffect(() => {
    if (!config) return;
    if (typeof window === 'undefined' || !window.NDEFReader) return;

    let otkazano = false;
    const reader = new window.NDEFReader();
    reader
      .scan()
      .then(() => {
        if (otkazano) return;
        setNfcStatus('ceka');
        reader.onreading = (event) => obradiNfcOcitavanje(event.serialNumber);
        reader.onreadingerror = () => setNfcStatus('greska');
      })
      .catch(() => setNfcStatus('greska'));

    return () => {
      otkazano = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    if (!config) return;
    window.onNfcTagFromNative = (serialNumber: string) => obradiNfcOcitavanje(serialNumber);
    return () => {
      window.onNfcTagFromNative = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  if (!config) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Učitavanje terminala…</p>
      </div>
    );
  }

  async function izvrsiUlazak(ciljniRadnikId: string) {
    const odluka = await proveriUlazakLokalno(ciljniRadnikId, config!.sektorId);
    const radnikIme = radnici?.find((r) => r.id === ciljniRadnikId)?.ime ?? 'Radnik';

    if (!odluka.odobreno) {
      setPoruka({
        vrsta: 'odbijeno',
        tekst: `ULAZAK ODBIJEN (${radnikIme}) — ${RAZLOG_TEKST[odluka.razlog]}`,
      });
      return;
    }

    const sektor = await db.sektori.get(config!.sektorId);
    const zadatak = await izaberiZadatakZaRadnika(ciljniRadnikId, config!.sektorId, sektor?.zadaciSabloni ?? []);

    await db.posete.add({
      id: crypto.randomUUID(),
      radnikId: ciljniRadnikId,
      radnikIme,
      sektorId: config!.sektorId,
      vremeUlaska: new Date().toISOString(),
      zadatakNaziv: zadatak?.naziv,
      zadatakOcekivanoTrajanje: zadatak?.ocekivanoTrajanje,
      idempotencyKeyUlazak: crypto.randomUUID(),
      sinhronizovanoUlazak: 0,
      sinhronizovanoIzlazak: 0,
    });

    setPoruka({
      vrsta: 'odobreno',
      tekst: zadatak
        ? `ULAZAK ODOBREN (${radnikIme}) — zadatak: ${zadatak.naziv}`
        : `ULAZAK ODOBREN (${radnikIme})`,
    });
    sinhronizujRed().catch(() => {});
  }

  async function izvrsiIzlazak(ciljniRadnikId: string) {
    const radnikIme = radnici?.find((r) => r.id === ciljniRadnikId)?.ime ?? 'Radnik';
    const otvorena = await db.posete
      .where('radnikId')
      .equals(ciljniRadnikId)
      .filter((p) => p.sektorId === config!.sektorId && !p.vremeIzlaska)
      .first();

    if (!otvorena) {
      setPoruka({
        vrsta: 'greska',
        tekst: `${radnikIme} nije evidentiran kao prisutan u ovom sektoru.`,
      });
      return;
    }

    const vremeIzlaska = new Date();
    const trajanjeMin = (vremeIzlaska.getTime() - new Date(otvorena.vremeUlaska).getTime()) / 60000;
    const { rezultat } = await oceniIzlazakLokalno(config!.sektorId, trajanjeMin);

    await db.posete.update(otvorena.id, {
      vremeIzlaska: vremeIzlaska.toISOString(),
      idempotencyKeyIzlazak: crypto.randomUUID(),
      anomalija: rezultat.ocenjeno ? rezultat.anomalija : false,
      zScore: rezultat.ocenjeno ? rezultat.zScore : undefined,
    });

    const trajanjeZaokruzeno = Math.round(trajanjeMin);
    if (rezultat.ocenjeno && rezultat.anomalija) {
      setPoruka({
        vrsta: 'anomalija',
        tekst: `ANOMALIJA (${radnikIme}) — zadržavanje ${trajanjeZaokruzeno} min`,
      });
    } else {
      setPoruka({
        vrsta: 'odobreno',
        tekst: `IZLAZAK evidentiran (${radnikIme}) — ${trajanjeZaokruzeno} min u sektoru`,
      });
    }
    sinhronizujRed().catch(() => {});
  }

  async function obradiNfcOcitavanje(serialNumber: string) {
    if (obradaRef.current) return;
    obradaRef.current = true;
    setPoruka(null);
    try {
      const radnik = await db.radnici.where('nfcTagId').equals(serialNumber).first();
      if (!radnik) {
        setPoruka({ vrsta: 'greska', tekst: 'Kartica nije prepoznata — obratite se administratoru.' });
        return;
      }
      const otvorena = await db.posete
        .where('radnikId')
        .equals(radnik.id)
        .filter((p) => p.sektorId === config!.sektorId && !p.vremeIzlaska)
        .first();
      if (otvorena) await izvrsiIzlazak(radnik.id);
      else await izvrsiUlazak(radnik.id);
    } catch (e) {
      setPoruka({ vrsta: 'greska', tekst: e instanceof Error ? e.message : 'Greška' });
    } finally {
      obradaRef.current = false;
      if (povratakTajmerRef.current) clearTimeout(povratakTajmerRef.current);
      povratakTajmerRef.current = setTimeout(() => setPoruka(null), 5000);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col p-4 sm:p-6 lg:p-10">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-6 sm:mb-8">
        <div className="min-w-0 flex items-center gap-3 sm:gap-4">
          <Logo size={36} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-[var(--color-text-muted)]">Kontrolna vrata sektora</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] truncate">
              {config.sektorNaziv}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="neu-raised-sm rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 text-sm">
            {online ? (
              <Wifi size={16} className="status-success" />
            ) : (
              <WifiOff size={16} className="status-warning" />
            )}
            <span className="text-[var(--color-text-muted)]">{online ? 'Online' : 'Oflajn'}</span>
          </div>
          <div className="neu-raised-sm rounded-full px-3 sm:px-4 py-2 text-sm text-[var(--color-text-muted)] whitespace-nowrap">
            Unutra: <span className="font-bold text-[var(--color-text)]">{trenutnoPrisutnih}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <Card className="w-full max-w-sm text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Skenirajte QR kod ili približite telefon (NFC) u ShiftOS aplikaciji
          </p>
          <div className="neu-raised-sm rounded-2xl p-4 bg-white inline-block">
            <canvas ref={qrCanvasRef} className="block w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]" />
          </div>
          <div className="neu-inset rounded-2xl px-4 py-3 mt-6 flex items-center justify-center gap-2 text-[var(--color-primary)]">
            <Nfc size={18} className={nfcStatus === 'ceka' ? 'animate-pulse' : ''} />
            <span className="text-xs font-medium">
              {nfcStatus === 'greska'
                ? 'NFC čitanje nedostupno na ovom uređaju'
                : 'NFC aktivan — radi i za fizičku karticu radnika'}
            </span>
          </div>
        </Card>

        {poruka && (
          <div
            className={`neu-inset rounded-2xl px-5 py-4 mt-6 text-center font-semibold w-full max-w-sm ${
              poruka.vrsta === 'odobreno'
                ? 'status-success'
                : poruka.vrsta === 'anomalija'
                  ? 'status-warning'
                  : 'status-critical'
            }`}
          >
            {poruka.tekst}
          </div>
        )}
      </div>
    </div>
  );
}
