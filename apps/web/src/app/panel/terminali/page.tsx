'use client';

import { useEffect, useState } from 'react';
import { MonitorCog, Save, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiGreska } from '@/lib/api';

interface SektorOpcija {
  id: string;
  naziv: string;
}

interface TerminalRed {
  id: string;
  naziv: string | null;
  sektorId: string;
  sektor: { naziv: string };
  createdAt: string;
}

export default function TerminaliStranica() {
  const [terminali, setTerminali] = useState<TerminalRed[]>([]);
  const [sektori, setSektori] = useState<SektorOpcija[]>([]);
  const [izboriSektor, setIzboriSektor] = useState<Record<string, string>>({});
  const [izboriNaziv, setIzboriNaziv] = useState<Record<string, string>>({});
  const [greska, setGreska] = useState<string | null>(null);
  const [cuvanje, setCuvanje] = useState<string | null>(null);
  const [brisanje, setBrisanje] = useState<string | null>(null);

  function ucitaj() {
    api
      .get<TerminalRed[]>('/terminali')
      .then((lista) => {
        setTerminali(lista);
        setIzboriSektor(Object.fromEntries(lista.map((t) => [t.id, t.sektorId])));
        setIzboriNaziv(Object.fromEntries(lista.map((t) => [t.id, t.naziv ?? ''])));
      })
      .catch((e) => setGreska(e instanceof ApiGreska ? e.message : 'Greška pri učitavanju.'));
    api.get<SektorOpcija[]>('/sektori').then(setSektori).catch(() => {});
  }

  useEffect(ucitaj, []);

  function izmenjeno(t: TerminalRed) {
    return izboriSektor[t.id] !== t.sektorId || (izboriNaziv[t.id] ?? '') !== (t.naziv ?? '');
  }

  async function sacuvaj(t: TerminalRed) {
    const sektorId = izboriSektor[t.id];
    if (!sektorId) return;
    setCuvanje(t.id);
    setGreska(null);
    try {
      const azuriran = await api.put<TerminalRed>(`/terminali/${t.id}`, {
        sektorId,
        naziv: izboriNaziv[t.id]?.trim() || undefined,
      });
      setTerminali((lista) => lista.map((x) => (x.id === t.id ? azuriran : x)));
      setIzboriNaziv((n) => ({ ...n, [t.id]: azuriran.naziv ?? '' }));
    } catch (e) {
      setGreska(e instanceof ApiGreska ? e.message : 'Greška pri čuvanju izmena.');
    } finally {
      setCuvanje(null);
    }
  }

  async function obrisi(t: TerminalRed) {
    if (!window.confirm(`Obrisati terminal "${t.naziv ?? t.id}"? Fizički uređaj bi morao ponovo da se registruje.`)) {
      return;
    }
    setBrisanje(t.id);
    setGreska(null);
    try {
      await api.delete(`/terminali/${t.id}`);
      setTerminali((lista) => lista.filter((x) => x.id !== t.id));
    } catch (e) {
      setGreska(e instanceof ApiGreska ? e.message : 'Greška pri brisanju terminala.');
    } finally {
      setBrisanje(null);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-[var(--color-text)] mb-2">Terminali</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Fizički TerminalShift uređaji na vratima sektora. Sektor terminala je zaključan na samom
        uređaju — jedino ovde, kao Administrator, možete da ga promenite ili uklonite.
      </p>

      {greska && (
        <div className="neu-inset rounded-2xl px-4 py-3 mb-6 text-sm status-critical">{greska}</div>
      )}

      {terminali.length === 0 && !greska && (
        <Card className="text-center py-10">
          <MonitorCog size={28} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-muted)]">
            Nema registrovanih terminala — prvo pokretanje TerminalShift aplikacije na uređaju ga
            automatski registruje.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {terminali.map((t) => (
          <Card key={t.id} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Trenutni sektor: {t.sektor.naziv} · registrovan{' '}
                  {new Date(t.createdAt).toLocaleDateString('sr-RS')}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] break-all">ID: {t.id}</p>
              </div>
              <button
                type="button"
                onClick={() => obrisi(t)}
                disabled={brisanje === t.id}
                title="Obriši terminal"
                className="neu-icon-circle w-9 h-9 shrink-0 status-critical"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[180px]">
                <Input
                  value={izboriNaziv[t.id] ?? ''}
                  onChange={(e) => setIzboriNaziv((n) => ({ ...n, [t.id]: e.target.value }))}
                  placeholder="Naziv (opciono)"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <Dropdown
                  value={izboriSektor[t.id] ?? t.sektorId}
                  onChange={(v) => setIzboriSektor((i) => ({ ...i, [t.id]: v }))}
                  options={sektori.map((s) => ({ value: s.id, label: s.naziv }))}
                  placeholder="Izaberite sektor"
                />
              </div>
              <Button
                variant="primary"
                disabled={cuvanje === t.id || !izmenjeno(t)}
                onClick={() => sacuvaj(t)}
                className="flex items-center gap-2 shrink-0"
              >
                <Save size={16} /> {cuvanje === t.id ? 'Čuvanje…' : 'Sačuvaj'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
