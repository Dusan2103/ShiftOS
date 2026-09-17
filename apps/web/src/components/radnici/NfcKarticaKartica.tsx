'use client';

import { useState } from 'react';
import { CreditCard, Nfc, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface Props {
  radnikId: string;
  nfcTagId: string | null;
  mozeDaMenja: boolean;
  onPromena: () => void;
}

export function NfcKarticaKartica({ radnikId, nfcTagId, mozeDaMenja, onPromena }: Props) {
  const [rucniUnos, setRucniUnos] = useState('');
  const [skeniranje, setSkeniranje] = useState(false);
  const [cuvanje, setCuvanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const nfcDostupanUOvomPregledacu = typeof window !== 'undefined' && !!window.NDEFReader;

  async function sacuvaj(tagId: string) {
    setCuvanje(true);
    setGreska(null);
    try {
      await api.put(`/radnici/${radnikId}/nfc`, { nfcTagId: tagId });
      setRucniUnos('');
      onPromena();
    } catch {
      setGreska('Čuvanje nije uspelo — možda je kartica već dodeljena drugom radniku.');
    } finally {
      setCuvanje(false);
    }
  }

  async function ukloni() {
    await api.delete(`/radnici/${radnikId}/nfc`);
    onPromena();
  }

  async function skeniraj() {
    if (!window.NDEFReader) return;
    setSkeniranje(true);
    setGreska(null);
    try {
      const reader = new window.NDEFReader();
      await reader.scan();
      reader.onreading = (event) => {
        setSkeniranje(false);
        sacuvaj(event.serialNumber);
      };
      reader.onreadingerror = () => {
        setSkeniranje(false);
        setGreska('Čitanje kartice nije uspelo, pokušajte ponovo.');
      };
    } catch {
      setSkeniranje(false);
      setGreska('Nije moguće pokrenuti NFC čitač (dozvola odbijena ili nema hardvera).');
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
        <CreditCard size={18} className="text-[var(--color-primary)]" />
        NFC kartica
      </h2>

      {nfcTagId ? (
        <div className="neu-inset rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-[var(--color-text)]">Kartica uparena</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{nfcTagId}</p>
          </div>
          {mozeDaMenja && (
            <button
              onClick={ukloni}
              className="text-[var(--color-text-muted)] hover:status-critical shrink-0"
              title="Ukloni karticu"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          Radnik nema uparenu NFC karticu — na terminalu se i dalje može identifikovati izborom sa liste.
        </p>
      )}

      {mozeDaMenja && (
        <div className="mt-4 flex flex-col gap-3">
          {nfcDostupanUOvomPregledacu && (
            <Button variant="raised" onClick={skeniraj} disabled={skeniranje || cuvanje}>
              <Nfc size={16} className="inline mr-2" />
              {skeniranje ? 'Prislonite karticu…' : 'Skeniraj novu karticu'}
            </Button>
          )}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Ili ručno unesite UID kartice"
              value={rucniUnos}
              onChange={(e) => setRucniUnos(e.target.value)}
              className="flex-1 min-w-[160px]"
            />
            <Button
              variant="raised"
              className="shrink-0"
              disabled={cuvanje || !rucniUnos.trim()}
              onClick={() => sacuvaj(rucniUnos.trim())}
            >
              Sačuvaj
            </Button>
          </div>
          {greska && <p className="text-xs status-critical">{greska}</p>}
        </div>
      )}
    </Card>
  );
}
