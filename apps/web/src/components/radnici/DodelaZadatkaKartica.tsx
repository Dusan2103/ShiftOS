'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface SektorOpcija {
  id: string;
  naziv: string;
}

interface DodelaRed {
  id: string;
  naziv: string;
  ocekivanoTrajanje: number;
  datum: string;
  sektor: { id: string; naziv: string };
}

function danasIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DodelaZadatkaKartica({ radnikId }: { radnikId: string }) {
  const [sektori, setSektori] = useState<SektorOpcija[]>([]);
  const [dodele, setDodele] = useState<DodelaRed[]>([]);
  const [sektorId, setSektorId] = useState('');
  const [naziv, setNaziv] = useState('');
  const [trajanje, setTrajanje] = useState('20');
  const [datum, setDatum] = useState(danasIso());
  const [cuvanje, setCuvanje] = useState(false);

  function osveziDodele() {
    api.get<DodelaRed[]>(`/dodele/radnik/${radnikId}`).then(setDodele).catch(() => {});
  }

  useEffect(() => {
    api.get<SektorOpcija[]>('/sektori').then(setSektori).catch(() => {});
    osveziDodele();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radnikId]);

  async function dodeli() {
    if (!sektorId || !naziv.trim() || !trajanje) return;
    setCuvanje(true);
    try {
      await api.post('/dodele', {
        radnikId,
        sektorId,
        naziv: naziv.trim(),
        ocekivanoTrajanje: Number(trajanje),
        datum,
      });
      setNaziv('');
      osveziDodele();
    } finally {
      setCuvanje(false);
    }
  }

  async function otkazi(id: string) {
    await api.delete(`/dodele/${id}`);
    osveziDodele();
  }

  return (
    <Card className="mb-6">
      <h2 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
        <ClipboardList size={18} className="text-[var(--color-primary)]" />
        Dodela zadatka
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Dropdown
          value={sektorId}
          onChange={setSektorId}
          options={sektori.map((s) => ({ value: s.id, label: s.naziv }))}
          placeholder="Sektor"
        />
        <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        <Input
          placeholder="Naziv zadatka"
          value={naziv}
          onChange={(e) => setNaziv(e.target.value)}
          className="sm:col-span-1"
        />
        <Input
          type="number"
          min={1}
          placeholder="Očekivano trajanje (min)"
          value={trajanje}
          onChange={(e) => setTrajanje(e.target.value)}
        />
      </div>
      <Button
        variant="primary"
        onClick={dodeli}
        disabled={cuvanje || !sektorId || !naziv.trim()}
      >
        Dodeli zadatak
      </Button>

      {dodele.length > 0 && (
        <div className="flex flex-col gap-2 mt-5">
          {dodele.map((d) => (
            <div
              key={d.id}
              className="neu-raised-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-[var(--color-text)] truncate">
                  {d.naziv} <span className="text-[var(--color-text-muted)]">— {d.sektor.naziv}</span>
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {new Date(d.datum).toLocaleDateString('sr-RS')} · {d.ocekivanoTrajanje} min
                </p>
              </div>
              <button
                onClick={() => otkazi(d.id)}
                className="text-[var(--color-text-muted)] hover:status-critical shrink-0"
                title="Otkaži dodelu"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
