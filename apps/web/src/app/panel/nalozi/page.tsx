'use client';

import { useEffect, useState } from 'react';
import { Check, X, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiGreska } from '@/lib/api';

interface ZahtevRed {
  id: string;
  email: string;
  createdAt: string;
  radnik: { ime: string } | null;
}

export default function NaloziNaCekanjuStranica() {
  const [zahtevi, setZahtevi] = useState<ZahtevRed[]>([]);
  const [ucitano, setUcitano] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [obrada, setObrada] = useState<string | null>(null);

  function ucitaj() {
    api
      .get<ZahtevRed[]>('/korisnici/na-cekanju')
      .then(setZahtevi)
      .catch((e) => setGreska(e instanceof ApiGreska ? e.message : 'Greška pri učitavanju.'))
      .finally(() => setUcitano(true));
  }

  useEffect(ucitaj, []);

  async function obradi(id: string, akcija: 'odobri' | 'odbij') {
    setObrada(id);
    try {
      await api.post(`/korisnici/${id}/${akcija}`);
      setZahtevi((z) => z.filter((r) => r.id !== id));
    } catch (e) {
      setGreska(e instanceof ApiGreska ? e.message : 'Greška pri obradi zahteva.');
    } finally {
      setObrada(null);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-[var(--color-text)] mb-2">Nalozi na čekanju</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Radnici koji su se sami registrovali i čekaju odobrenje pre prve prijave.
      </p>

      {greska && (
        <div className="neu-inset rounded-2xl px-4 py-3 mb-6 text-sm status-critical">{greska}</div>
      )}

      {ucitano && zahtevi.length === 0 && !greska && (
        <Card className="text-center py-10">
          <UserCheck size={28} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-muted)]">Nema zahteva na čekanju.</p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {zahtevi.map((z) => (
          <Card key={z.id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[var(--color-text)] truncate">
                {z.radnik?.ime ?? 'Nepoznat radnik'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{z.email}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Zahtev: {new Date(z.createdAt).toLocaleString('sr-RS')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="primary"
                disabled={obrada === z.id}
                onClick={() => obradi(z.id, 'odobri')}
                className="flex items-center gap-2"
              >
                <Check size={16} /> Odobri
              </Button>
              <Button
                variant="raised"
                disabled={obrada === z.id}
                onClick={() => obradi(z.id, 'odbij')}
                className="flex items-center gap-2"
              >
                <X size={16} /> Odbij
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
