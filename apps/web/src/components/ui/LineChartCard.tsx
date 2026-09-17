'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card } from './Card';
import { InfoOznaka } from './InfoOznaka';
import { clsx } from '@/lib/clsx';

interface TackaPodataka {
  label: string;
  value: number;
}

interface LineChartCardProps {
  naslov: string;
  podnaslov?: string;
  vrednost?: string | number;
  podaci: TackaPodataka[];
  boja?: string;
  onKlik?: () => void;
}

export function LineChartCard({
  naslov,
  podnaslov,
  vrednost,
  podaci,
  boja = '#2E6BF0',
  onKlik,
}: LineChartCardProps) {
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
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{naslov}</p>
          {vrednost !== undefined && (
            <p className="text-3xl font-bold text-[var(--color-text)] mt-1">{vrednost}</p>
          )}
        </div>
        {podnaslov && (
          <span className="text-xs text-[var(--color-text-muted)] neu-raised-sm rounded-full px-3 py-1">
            {podnaslov}
          </span>
        )}
      </div>
      <div className="h-24 -mx-2 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={podaci} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={{
                background: '#EEF2F7',
                border: 'none',
                borderRadius: 12,
                boxShadow: '4px 4px 10px rgba(163,177,198,0.5)',
                fontSize: 12,
              }}
              labelStyle={{ color: '#8A94A6' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={boja}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: boja, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
