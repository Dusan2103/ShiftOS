'use client';

import { bojaSektora } from '@/lib/sektor-boje';

interface Segment {
  sektorId: string;
  sektorNaziv: string;
  vremeUlaska: string;
  vremeIzlaska: string | null;
  anomalija: boolean;
}

interface DnevnaTrakaProps {
  segmenti: Segment[];
  pocetakDana?: Date;
}

const MS_U_DANU = 24 * 60 * 60 * 1000;

export function DnevnaTraka({ segmenti, pocetakDana }: DnevnaTrakaProps) {
  const pocetak = (pocetakDana ?? new Date(new Date().setHours(0, 0, 0, 0))).getTime();

  return (
    <div>
      <div className="neu-inset rounded-2xl h-14 relative overflow-hidden">
        {segmenti.map((s, i) => {
          const start = new Date(s.vremeUlaska).getTime();
          const kraj = s.vremeIzlaska ? new Date(s.vremeIzlaska).getTime() : Date.now();
          const leftPct = Math.max(0, ((start - pocetak) / MS_U_DANU) * 100);
          const widthPct = Math.max(0.4, ((kraj - start) / MS_U_DANU) * 100);

          return (
            <div
              key={i}
              title={`${s.sektorNaziv} (${new Date(s.vremeUlaska).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })})`}
              className="absolute top-1 bottom-1 rounded-lg"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                background: bojaSektora(s.sektorId),
                outline: s.anomalija ? '2px solid #E5533C' : undefined,
                outlineOffset: s.anomalija ? '1px' : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-2">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
}
