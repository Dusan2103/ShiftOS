'use client';

import { clsx } from '@/lib/clsx';

interface TimelineTacka {
  label: string;
  active?: boolean;
}

interface TimelineProps {
  tacke: TimelineTacka[];
}

export function Timeline({ tacke }: TimelineProps) {
  return (
    <div className="flex items-center w-full">
      {tacke.map((tacka, i) => (
        <div key={tacka.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <span
              className={clsx(
                'rounded-full transition-all',
                tacka.active
                  ? 'w-4 h-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] shadow-[0_0_0_4px_rgba(46,107,240,0.15)]'
                  : 'w-2.5 h-2.5 bg-[rgba(163,177,198,0.5)]',
              )}
            />
            <span
              className={clsx(
                'text-xs whitespace-nowrap',
                tacka.active
                  ? 'text-[var(--color-text)] font-semibold'
                  : 'text-[var(--color-text-muted)]',
              )}
            >
              {tacka.label}
            </span>
          </div>
          {i < tacke.length - 1 && (
            <div className="flex-1 h-[2px] mx-2 bg-[rgba(163,177,198,0.35)] rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
}
