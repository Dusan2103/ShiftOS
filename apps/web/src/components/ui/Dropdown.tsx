'use client';

import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}

export function Dropdown({ value, onChange, options, placeholder }: DropdownProps) {
  return (
    <div className="neu-dropdown relative flex items-center px-4 py-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent outline-none pr-6 text-[var(--color-text)]"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={18} className="absolute right-4 text-[var(--color-text-muted)] pointer-events-none" />
    </div>
  );
}
