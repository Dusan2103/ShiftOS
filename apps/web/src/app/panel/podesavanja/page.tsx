'use client';

import { useCallback, useEffect, useState } from 'react';
import { clsx } from '@/lib/clsx';
import { api } from '@/lib/api';
import { KvalifikacijeTab, Kvalifikacija } from '@/components/podesavanja/KvalifikacijeTab';
import { SektoriTab, Sektor } from '@/components/podesavanja/SektoriTab';
import { MatricaTab, Radnik } from '@/components/podesavanja/MatricaTab';

const TABOVI = [
  { key: 'sektori', label: 'Sektori i zadaci' },
  { key: 'kvalifikacije', label: 'Kvalifikacije' },
  { key: 'matrica', label: 'Radnici i kvalifikacije' },
] as const;

type TabKljuc = (typeof TABOVI)[number]['key'];

export default function PodesavanjaStranica() {
  const [tab, setTab] = useState<TabKljuc>('sektori');
  const [kvalifikacije, setKvalifikacije] = useState<Kvalifikacija[]>([]);
  const [sektori, setSektori] = useState<Sektor[]>([]);
  const [radnici, setRadnici] = useState<Radnik[]>([]);

  const osveziKvalifikacije = useCallback(() => {
    api.get<Kvalifikacija[]>('/kvalifikacije').then(setKvalifikacije).catch(() => {});
  }, []);
  const osveziSektore = useCallback(() => {
    api.get<Sektor[]>('/sektori').then(setSektori).catch(() => {});
  }, []);
  const osveziRadnike = useCallback(() => {
    api.get<Radnik[]>('/radnici').then(setRadnici).catch(() => {});
  }, []);

  useEffect(() => {
    osveziKvalifikacije();
    osveziSektore();
    osveziRadnike();
  }, [osveziKvalifikacije, osveziSektore, osveziRadnike]);

  return (
    <div>
      <h1 className="text-lg font-bold text-[var(--color-text)] mb-6">Podešavanja pogona</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABOVI.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-medium transition shrink-0 whitespace-nowrap',
              tab === t.key ? 'neu-inset text-[var(--color-primary)]' : 'neu-raised-sm text-[var(--color-text-muted)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sektori' && (
        <SektoriTab sektori={sektori} kvalifikacije={kvalifikacije} osveziSektore={osveziSektore} />
      )}
      {tab === 'kvalifikacije' && (
        <KvalifikacijeTab kvalifikacije={kvalifikacije} osveziKvalifikacije={osveziKvalifikacije} />
      )}
      {tab === 'matrica' && (
        <MatricaTab radnici={radnici} kvalifikacije={kvalifikacije} osveziRadnike={osveziRadnike} />
      )}
    </div>
  );
}
