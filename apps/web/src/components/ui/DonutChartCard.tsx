'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card } from './Card';
import { InfoOznaka } from './InfoOznaka';
import { clsx } from '@/lib/clsx';

interface DonutChartCardProps {
  naslov: string;
  procenat: number;
  boja?: string;
  napomena?: string;
  onKlik?: () => void;
}

export function DonutChartCard({
  naslov,
  procenat,
  boja = '#2E6BF0',
  napomena,
  onKlik,
}: DonutChartCardProps) {
  const vrednost = Math.min(100, Math.max(0, procenat));
  const podaci = [
    { name: 'popunjeno', value: vrednost },
    { name: 'ostatak', value: 100 - vrednost },
  ];

  return (
    <Card
      className={clsx('relative', onKlik && 'cursor-pointer transition hover:brightness-[0.98] active:scale-[0.99]')}
      onClick={onKlik}
      role={onKlik ? 'button' : undefined}
      tabIndex={onKlik ? 0 : undefined}
      onKeyDown={
        onKlik
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onKlik();
              }
            }
          : undefined
      }
    >
      {onKlik && <InfoOznaka />}
      <p className="text-sm text-[var(--color-text-muted)] mb-2">{naslov}</p>
      <div className="relative h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={podaci}
              dataKey="value"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={boja} />
              <Cell fill="rgba(163,177,198,0.25)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[var(--color-text)]">
            {Math.round(vrednost)}%
          </span>
          {napomena && (
            <span className="text-xs text-[var(--color-text-muted)] mt-1">{napomena}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
