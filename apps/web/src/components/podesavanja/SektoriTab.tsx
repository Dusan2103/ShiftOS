'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Kvalifikacija } from './KvalifikacijeTab';

export interface ZadatakSablon {
  id: string;
  naziv: string;
  ocekivanoTrajanje: number;
}

export interface Sektor {
  id: string;
  naziv: string;
  potrebnaKvalifikacijaId: string;
  potrebnaKvalifikacija?: Kvalifikacija;
  minimum: number;
  kapacitet: number;
  zadaciSabloni: ZadatakSablon[];
}

interface Props {
  sektori: Sektor[];
  kvalifikacije: Kvalifikacija[];
  osveziSektore: () => void;
}

const PRAZAN_FORM = { naziv: '', potrebnaKvalifikacijaId: '', minimum: '1', kapacitet: '1' };

export function SektoriTab({ sektori, kvalifikacije, osveziSektore }: Props) {
  const [noviForm, setNoviForm] = useState(PRAZAN_FORM);
  const [prosireno, setProsireno] = useState<string | null>(null);
  const [cuvanje, setCuvanje] = useState(false);

  async function kreirajSektor() {
    if (!noviForm.naziv.trim() || !noviForm.potrebnaKvalifikacijaId) return;
    setCuvanje(true);
    try {
      await api.post('/sektori', {
        naziv: noviForm.naziv.trim(),
        potrebnaKvalifikacijaId: noviForm.potrebnaKvalifikacijaId,
        minimum: Number(noviForm.minimum),
        kapacitet: Number(noviForm.kapacitet),
      });
      setNoviForm(PRAZAN_FORM);
      osveziSektore();
    } finally {
      setCuvanje(false);
    }
  }

  async function izmeniSektor(s: Sektor, polje: Partial<Sektor>) {
    await api.put(`/sektori/${s.id}`, {
      naziv: polje.naziv ?? s.naziv,
      potrebnaKvalifikacijaId: polje.potrebnaKvalifikacijaId ?? s.potrebnaKvalifikacijaId,
      minimum: polje.minimum ?? s.minimum,
      kapacitet: polje.kapacitet ?? s.kapacitet,
    });
    osveziSektore();
  }

  async function obrisiSektor(id: string) {
    if (!confirm('Obrisati ovaj sektor? Istorija poseta ostaje sačuvana.')) return;
    await api.delete(`/sektori/${id}`);
    osveziSektore();
  }

  async function dodajZadatak(sektorId: string, naziv: string, ocekivanoTrajanje: number) {
    if (!naziv.trim() || !ocekivanoTrajanje) return;
    await api.post(`/sektori/${sektorId}/zadaci`, { naziv: naziv.trim(), ocekivanoTrajanje });
    osveziSektore();
  }

  async function obrisiZadatak(zadatakSablonId: string) {
    await api.delete(`/sektori/zadaci/${zadatakSablonId}`);
    osveziSektore();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="font-semibold text-[var(--color-text)] mb-4">Novi sektor</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Naziv sektora"
            value={noviForm.naziv}
            onChange={(e) => setNoviForm({ ...noviForm, naziv: e.target.value })}
          />
          <Dropdown
            value={noviForm.potrebnaKvalifikacijaId}
            onChange={(v) => setNoviForm({ ...noviForm, potrebnaKvalifikacijaId: v })}
            options={kvalifikacije.map((k) => ({ value: k.id, label: k.naziv }))}
            placeholder="Potrebna kvalifikacija"
          />
          <Input
            type="number"
            min={0}
            placeholder="Minimum"
            value={noviForm.minimum}
            onChange={(e) => setNoviForm({ ...noviForm, minimum: e.target.value })}
          />
          <Input
            type="number"
            min={1}
            placeholder="Kapacitet"
            value={noviForm.kapacitet}
            onChange={(e) => setNoviForm({ ...noviForm, kapacitet: e.target.value })}
          />
        </div>
        <Button
          variant="primary"
          className="mt-4"
          onClick={kreirajSektor}
          disabled={cuvanje || !noviForm.naziv.trim() || !noviForm.potrebnaKvalifikacijaId}
        >
          <Plus size={16} className="inline mr-1" /> Dodaj sektor
        </Button>
      </Card>

      {sektori.map((s) => (
        <Card key={s.id}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <Input value={s.naziv} onChange={(e) => izmeniSektor(s, { naziv: e.target.value })} />
            <Dropdown
              value={s.potrebnaKvalifikacijaId}
              onChange={(v) => izmeniSektor(s, { potrebnaKvalifikacijaId: v })}
              options={kvalifikacije.map((k) => ({ value: k.id, label: k.naziv }))}
            />
            <Input
              type="number"
              min={0}
              value={s.minimum}
              onChange={(e) => izmeniSektor(s, { minimum: Number(e.target.value) })}
            />
            <Input
              type="number"
              min={1}
              value={s.kapacitet}
              onChange={(e) => izmeniSektor(s, { kapacitet: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setProsireno(prosireno === s.id ? null : s.id)}
              className="text-sm text-[var(--color-primary)] font-medium flex items-center gap-1"
            >
              Zadaci sektora ({s.zadaciSabloni.length})
              {prosireno === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button onClick={() => obrisiSektor(s.id)} className="text-[var(--color-text-muted)] hover:status-critical">
              <Trash2 size={16} />
            </button>
          </div>

          {prosireno === s.id && (
            <ZadaciSablona
              sektorId={s.id}
              zadaci={s.zadaciSabloni}
              onDodaj={dodajZadatak}
              onObrisi={obrisiZadatak}
            />
          )}
        </Card>
      ))}
    </div>
  );
}

function ZadaciSablona({
  sektorId,
  zadaci,
  onDodaj,
  onObrisi,
}: {
  sektorId: string;
  zadaci: ZadatakSablon[];
  onDodaj: (sektorId: string, naziv: string, ocekivanoTrajanje: number) => Promise<void>;
  onObrisi: (id: string) => Promise<void>;
}) {
  const [naziv, setNaziv] = useState('');
  const [trajanje, setTrajanje] = useState('15');

  return (
    <div className="mt-4 neu-inset rounded-2xl p-4">
      <div className="flex flex-col gap-2 mb-3">
        {zadaci.map((z) => (
          <div key={z.id} className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text)]">
              {z.naziv} <span className="text-[var(--color-text-muted)]">({z.ocekivanoTrajanje} min)</span>
            </span>
            <button onClick={() => onObrisi(z.id)} className="text-[var(--color-text-muted)] hover:status-critical">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {zadaci.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">Nema definisanih zadataka za ovaj sektor.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Naziv zadatka"
          value={naziv}
          onChange={(e) => setNaziv(e.target.value)}
          className="flex-1 min-w-[140px]"
        />
        <Input
          type="number"
          min={1}
          className="w-24 shrink-0"
          value={trajanje}
          onChange={(e) => setTrajanje(e.target.value)}
        />
        <Button
          variant="raised"
          className="shrink-0"
          onClick={async () => {
            await onDodaj(sektorId, naziv, Number(trajanje));
            setNaziv('');
          }}
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}
