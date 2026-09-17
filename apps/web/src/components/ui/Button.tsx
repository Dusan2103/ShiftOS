'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from '@/lib/clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'raised' | 'primary' | 'ghost';
  size?: 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'raised', size = 'md', className, children, ...props }, ref) => {
    const base =
      variant === 'primary'
        ? 'neu-btn-primary'
        : variant === 'ghost'
          ? 'bg-transparent'
          : 'neu-btn';

    const sizeClasses = size === 'lg' ? 'px-8 py-4 text-lg' : 'px-5 py-3 text-sm';

    return (
      <button
        ref={ref}
        className={clsx(
          base,
          sizeClasses,
          'font-semibold select-none outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
