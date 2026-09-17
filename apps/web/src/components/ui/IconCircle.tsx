'use client';

import { ReactNode } from 'react';
import { clsx } from '@/lib/clsx';

interface IconCircleProps {
  icon: ReactNode;
  active?: boolean;
  size?: number;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export function IconCircle({
  icon,
  active,
  size = 44,
  onClick,
  title,
  className,
}: IconCircleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      data-active={active ?? false}
      className={clsx(
        'neu-icon-circle text-[var(--color-text)]',
        !onClick && 'cursor-default',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {icon}
    </button>
  );
}
