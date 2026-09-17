'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

interface RadnikRed {
  id: string;
  ime: string;
  kvalifikacije: { kvalifikacija: { naziv: string } }[];
}

export default function RadniciStranica() {
  const router = useRouter();
  const [radnici, setRadnici] = useState<RadnikRed[]>([]);

  useEffect(() => {
    api.get<RadnikRed[]>('/radnici').then(setRadnici).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-lg font-bold text-[var(--color-text)] mb-6">Radnici</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {radnici.map((r) => (
          <Card
            key={r.id}
            className="cursor-pointer flex items-center justify-between"
            onClick={() => router.push(`/panel/radnici/detalj?id=${r.id}`)}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="neu-icon-circle w-11 h-11 text-[var(--color-primary)] shrink-0">
                <User size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text)] truncate">{r.ime}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {r.kvalifikacije.length > 0
                    ? r.kvalifikacije.map((k) => k.kvalifikacija.naziv).join(', ')
                    : 'Nema dodeljenih kvalifikacija'}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--color-text-muted)] shrink-0 ml-2" />
          </Card>
        ))}
      </div>
    </div>
  );
}
