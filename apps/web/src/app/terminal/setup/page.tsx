'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MonitorCog } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { api, API_URL, ApiGreska } from '@/lib/api';
import { db } from '@/lib/db';
import { osveziKes } from '@/lib/cache-refresh';
import { postaviTerminalIdNaUredjaju } from '@/lib/platforma';

interface SektorOpcija {
  id: string;
  naziv: string;
}

interface TerminalOdgovor {
  id: string;
  sektorId: string;
  sektor: { naziv: string };
}

export default function SetupTerminala() {
  const router = useRouter();
  const [zakljucan, setZakljucan] = useState<boolean | null>(null);
  const [sektori, setSektori] = useState<SektorOpcija[]>([]);
  const [sektorId, setSektorId] = useState('');
  const [naziv, setNaziv] = useState('');
  const [serverUrl, setServerUrl] = useState(API_URL);
  const [greska, setGreska] = useState<string | null>(null);
  const [ucitava, setUcitava] = useState(false);
  const [cuvanje, setCuvanje] = useState(false);

  useEffect(() => {
    db.podesavanje.get('config').then((c) => {
      if (c) {
        router.replace('/terminal');
      } else {
        setZakljucan(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (zakljucan !== false) return;
    setUcitava(true);
    api
      .get<SektorOpcija[]>('/sektori')
      .then(setSektori)
      .catch((e) => setGreska(e instanceof ApiGreska ? e.message : 'Nema veze sa serverom.'))
      .finally(() => setUcitava(false));
  }, [zakljucan]);

  async function sacuvaj() {
    if (!sektorId) return;
    setCuvanje(true);
    setGreska(null);
    try {
      const terminal = await api.post<TerminalOdgovor>('/terminali', {
        sektorId,
        naziv: naziv.trim() || undefined,
      });
      await db.podesavanje.put({
        id: 'config',
        terminalId: terminal.id,
        sektorId: terminal.sektorId,
        sektorNaziv: terminal.sektor.naziv,
        serverUrl,
      });
      postaviTerminalIdNaUredjaju(terminal.id);
      await osveziKes(sektorId);
      router.replace('/terminal');
    } catch (e) {
      setGreska(e instanceof ApiGreska ? e.message : 'Registracija terminala nije uspela — proverite vezu.');
    } finally {
      setCuvanje(false);
    }
  }

  if (zakljucan !== false) return null;

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <Logo size={36} className="mb-6" />
        <div className="flex items-center gap-3 mb-6">
          <div className="neu-icon-circle w-12 h-12 text-[var(--color-primary)]">
            <MonitorCog size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Podešavanje terminala</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Prvo i JEDINO pokretanje — nakon čuvanja se sektor zaključava</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-[var(--color-text-muted)] mb-2 block">
              Naziv terminala (opciono, npr. "Ulaz — sever")
            </label>
            <Input value={naziv} onChange={(e) => setNaziv(e.target.value)} placeholder="Bez naziva" />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-muted)] mb-2 block">
              Sektor koji ovaj terminal predstavlja
            </label>
            <Dropdown
              value={sektorId}
              onChange={setSektorId}
              options={sektori.map((s) => ({ value: s.id, label: s.naziv }))}
              placeholder={ucitava ? 'Učitavanje sektora…' : 'Izaberite sektor'}
            />
          </div>

          <div>
            <label className="text-sm text-[var(--color-text-muted)] mb-2 block">
              Adresa servera (za sinhronizaciju)
            </label>
            <Input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          </div>

          {greska && (
            <div className="neu-inset rounded-2xl px-4 py-3 text-sm status-critical">{greska}</div>
          )}

          <Button
            variant="primary"
            size="lg"
            disabled={!sektorId || cuvanje}
            onClick={sacuvaj}
            className="mt-2"
          >
            {cuvanje ? 'Registracija…' : 'Zaključaj i pokreni terminal'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
