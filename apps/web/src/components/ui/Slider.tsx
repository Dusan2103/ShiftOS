'use client';

interface SliderProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  label?: string;
}

export function Slider({ value, onChange, readOnly, label }: SliderProps) {
  const procenat = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-[var(--color-text-muted)] mb-2">
          <span>{label}</span>
          <span className="font-semibold text-[var(--color-text)]">{Math.round(procenat)}%</span>
        </div>
      )}
      <div className="neu-slider-track relative">
        <div className="neu-slider-fill" style={{ width: `${procenat}%` }} />
        <div className="neu-slider-thumb" style={{ left: `${procenat}%` }} />
        {!readOnly && (
          <input
            type="range"
            min={0}
            max={100}
            value={procenat}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={label}
          />
        )}
      </div>
    </div>
  );
}
