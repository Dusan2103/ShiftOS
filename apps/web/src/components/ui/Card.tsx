import { HTMLAttributes } from 'react';
import { clsx } from '@/lib/clsx';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('neu-card p-4 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}
