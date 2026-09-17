'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card } from './Card';

interface TackaPodataka {
  label: string;
  value: number;
}

interface AreaChartCardProps {
  naslov: string;
  vrednost?: string | number;
  podaci: TackaPodataka[];
  boja?: string;
}

export function AreaChartCard({
  naslov,
  vrednost,
  podaci,
  boja = '#2E6BF0',
}: AreaChartCardProps) {
  const gradientId = `areaGradient-${naslov.replace(/\s+/g, '')}`;

  return (
    <Card>
      <p className="text-sm text-[var(--color-text-muted)]">{naslov}</p>
      {vrednost !== undefined && (
        <p className="text-3xl font-bold text-[var(--color-text)] mt-1">{vrednost}</p>
      )}
      <div className="h-28 -mx-2 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={podaci} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={boja} stopOpacity={0.35} />
                <stop offset="100%" stopColor={boja} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={{
                background: '#EEF2F7',
                border: 'none',
                borderRadius: 12,
                boxShadow: '4px 4px 10px rgba(163,177,198,0.5)',
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={boja}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
