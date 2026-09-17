'use client';

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { clsx } from '@/lib/clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, rightSlot, className, ...props }, ref) => {
    return (
      <div className={clsx('neu-input flex items-center gap-3 px-4 py-3', className)}>
        {icon && <span className="text-[var(--color-text-muted)] shrink-0">{icon}</span>}
        <input
          ref={ref}
          className="w-full bg-transparent outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          {...props}
        />
        {rightSlot && <span className="shrink-0">{rightSlot}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';
