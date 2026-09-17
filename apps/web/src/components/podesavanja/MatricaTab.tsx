'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Kvalifikacija } from './KvalifikacijeTab';

export interface Radnik {
  id: string;
  ime: string;
  kvalifikacije: { kvalifikacijaId: string }[];
}

interface Props {
  radnici: Radnik[];
  kvalifikacije: Kvalifikacija[];
  osveziRadnike: () => void;
}

export function MatricaTab({ radnici, kvalifikacije, osveziRadnike }: Props) {
  const [novoIme, setNovoIme] = useState('');
  const [cuvanje, setCuvanje] = useState(false);

  async function toggle(radnikId: string, kvalifikacijaId: string, ima: boolean) {
    if (ima) {
      await api.delete(`/radnici/${radnikId}/kvalifikacije/${kvalifikacijaId}`);
    } else {
      await api.post(`/radnici/${radnikId}/kvalifikacije/${kvalifikacijaId}`);
    }
    osveziRadnike();
  }

  async function dodajRadnika() {
    if (!novoIme.trim()) return;
    setCuvanje(true);
    try {
      await api.post('/radnici', { ime: novoIme.trim() });
      setNovoIme('');
      osveziRadnike();
    } finally {
      setCuvanje(false);
    }
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 sm:p-6 flex flex-wrap gap-3">
        <Input
          placeholder="Ime novog radnika"
          value={novoIme}
          onChange={(e) => setNovoIme(e.target.value)}
          className="flex-1 min-w-[160px]"
        />
        <Button
          variant="primary"
          onClick={dodajRadnika}
          disabled={cuvanje || !novoIme.trim()}
          className="shrink-0"
        >
          Dodaj radnika
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-text-muted)]">
              <th className="px-6 py-3 font-medium sticky left-0 bg-[var(--color-surface)]">Radnik</th>
              {kvalifikacije.map((k) => (
                <th key={k.id} className="px-4 py-3 font-medium text-center whitespace-nowrap">
                  {k.naziv}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(163,177,198,0.25)]">
            {radnici.map((r) => (
              <tr key={r.id}>
                <td className="px-6 py-3 font-medium text-[var(--color-text)] sticky left-0 bg-[var(--color-surface)]">
                  {r.ime}
                </td>
                {kvalifikacije.map((k) => {
                  const ima = r.kvalifikacije.some((rk) => rk.kvalifikacijaId === k.id);
                  return (
                    <td key={k.id} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={ima}
                        onChange={() => toggle(r.id, k.id, ima)}
                        className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
