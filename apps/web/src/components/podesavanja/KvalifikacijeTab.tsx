'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export interface Kvalifikacija {
  id: string;
  naziv: string;
}

interface Props {
  kvalifikacije: Kvalifikacija[];
  osveziKvalifikacije: () => void;
}

export function KvalifikacijeTab({ kvalifikacije, osveziKvalifikacije }: Props) {
  const [naziv, setNaziv] = useState('');
  const [cuvanje, setCuvanje] = useState(false);

  async function dodaj() {
    if (!naziv.trim()) return;
    setCuvanje(true);
    try {
      await api.post('/kvalifikacije', { naziv: naziv.trim() });
      setNaziv('');
      osveziKvalifikacije();
    } finally {
      setCuvanje(false);
    }
  }

  async function obrisi(id: string) {
    if (!confirm('Obrisati ovu kvalifikaciju? Ovo utiče na sektore koji je zahtevaju.')) return;
    await api.delete(`/kvalifikacije/${id}`);
    osveziKvalifikacije();
  }

  return (
    <Card>
      <h2 className="font-semibold text-[var(--color-text)] mb-4">Kvalifikacije</h2>

      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Naziv nove kvalifikacije"
          value={naziv}
          onChange={(e) => setNaziv(e.target.value)}
          className="flex-1 min-w-0"
        />
        <Button variant="primary" onClick={dodaj} disabled={cuvanje || !naziv.trim()} className="shrink-0">
          <Plus size={18} />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {kvalifikacije.map((k) => (
          <div key={k.id} className="neu-raised-sm rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-[var(--color-text)]">{k.naziv}</span>
            <button onClick={() => obrisi(k.id)} className="text-[var(--color-text-muted)] hover:status-critical">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {kvalifikacije.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">Nema definisanih kvalifikacija.</p>
        )}
      </div>
    </Card>
  );
}
