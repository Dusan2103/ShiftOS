'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Nfc, ArrowLeft } from 'lucide-react';
import { Uloga } from '@shiftos/shared';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { QrSkener } from '@/components/terminal/QrSkener';
import { api, ApiGreska } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface TerminalOdgovor {
  id: string;
  sektorId: string;
  sektor: { naziv: string };
}

interface MojaAktivnaPoseta {
  id: string;
}

type Poruka = { vrsta: 'odobreno' | 'odbijeno' | 'anomalija' | 'greska'; tekst: string } | null;
type Mod = 'izbor' | 'qr' | 'nfc';

export default function PrijavaNaSektorStranica() {
  const router = useRouter();
  const korisnik = useAuthStore((s) => s.korisnik);
  const hidriran = useAuthStore((s) => s.hidriran);
  const [mod, setMod] = useState<Mod>('izbor');
  const [poruka, setPoruka] = useState<Poruka>(null);
  const [obrada, setObrada] = useState(false);
  const obradaRef = useRef(false);

  useEffect(() => {
    if (!hidriran) return;
    if (!korisnik) {
      router.replace('/login');
      return;
    }
    if (korisnik.uloga !== Uloga.RADNIK || !korisnik.radnikId) {
      router.replace(korisnik.uloga === Uloga.RADNIK ? '/terminal' : '/panel');
    }
  }, [korisnik, hidriran, router]);

  useEffect(() => {
    if (mod !== 'nfc') return;
    window.onNdefTekstFromNative = (tekst: string) => obradiTerminalId(tekst);
    return () => {
      window.onNdefTekstFromNative = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod]);

  if (!korisnik || korisnik.uloga !== Uloga.RADNIK || !korisnik.radnikId) return null;
  const radnikId = korisnik.radnikId;

  async function obradiTerminalId(terminalId: string) {
    if (obradaRef.current) return;
    obradaRef.current = true;
    setObrada(true);
    setPoruka(null);
    try {
      const terminal = await api.get<TerminalOdgovor>(`/terminali/${terminalId}`);
      const otvorena = await api.get<MojaAktivnaPoseta | null>(
        `/posete/moja-aktivna?sektorId=${terminal.sektorId}`,
      );

      if (otvorena) {
        await api.post('/posete/izlazak', {
          idempotencyKey: crypto.randomUUID(),
          posetaId: otvorena.id,
        });
        setPoruka({ vrsta: 'odobreno', tekst: `Izlazak evidentiran — ${terminal.sektor.naziv}` });
      } else {
        const odgovor = await api.post<{ odobreno: boolean; razlog?: string }>('/posete/ulazak', {
          idempotencyKey: crypto.randomUUID(),
          radnikId,
          sektorId: terminal.sektorId,
        });
        if (odgovor.odobreno) {
          setPoruka({ vrsta: 'odobreno', tekst: `Ulazak odobren — ${terminal.sektor.naziv}` });
        } else {
          setPoruka({
            vrsta: 'odbijeno',
            tekst:
              odgovor.razlog === 'KAPACITET_POPUNJEN'
                ? 'Sektor je popunjen do kapaciteta.'
                : 'Nemate potrebnu kvalifikaciju za ovaj sektor.',
          });
        }
      }
    } catch (e) {
      setPoruka({ vrsta: 'greska', tekst: e instanceof ApiGreska ? e.message : 'Greška pri povezivanju sa serverom.' });
    } finally {
      obradaRef.current = false;
      setObrada(false);
      setMod('izbor');
    }
  }

  return (
    <div className="min-h-dvh flex flex-col p-4 sm:p-6 lg:p-10">
      <header className="mb-6 sm:mb-8">
        <Logo size={32} className="mb-4" />
        <button
          type="button"
          onClick={() => router.push('/moj-profil')}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-3"
        >
          <ArrowLeft size={16} /> Moj profil
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Prijava na sektor</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <Card className="w-full max-w-lg">
          {mod === 'izbor' && (
            <>
              <p className="text-sm text-[var(--color-text-muted)] mb-4 text-center">
                Skenirajte QR kod ili pročitajte NFC sa terminala na vratima sektora
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMod('qr')}
                  disabled={obrada}
                  className="neu-raised rounded-2xl px-4 py-8 flex flex-col items-center gap-3 text-[var(--color-text)] active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <QrCode size={36} className="text-[var(--color-primary)]" />
                  <span className="font-semibold">Skeniraj QR kod</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMod('nfc')}
                  disabled={obrada}
                  className="neu-raised rounded-2xl px-4 py-8 flex flex-col items-center gap-3 text-[var(--color-text)] active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <Nfc size={36} className="text-[var(--color-primary)]" />
                  <span className="font-semibold">Očitaj NFC</span>
                </button>
              </div>
            </>
          )}

          {mod === 'qr' && (
            <>
              <button
                type="button"
                onClick={() => setMod('izbor')}
                className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-4"
              >
                <ArrowLeft size={16} /> Nazad
              </button>
              <QrSkener onOcitano={obradiTerminalId} onZatvori={() => setMod('izbor')} />
            </>
          )}

          {mod === 'nfc' && (
            <>
              <button
                type="button"
                onClick={() => setMod('izbor')}
                className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-4"
              >
                <ArrowLeft size={16} /> Nazad
              </button>
              <div className="neu-inset rounded-2xl px-5 py-10 flex flex-col items-center gap-4 text-[var(--color-primary)]">
                <Nfc size={48} className="animate-pulse" />
                <span className="text-sm font-medium text-center">Približite telefon terminalu</span>
              </div>
            </>
          )}

          {poruka && (
            <div
              className={`neu-inset rounded-2xl px-5 py-4 mt-6 text-center font-semibold ${
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
        </Card>
      </div>
    </div>
  );
}
