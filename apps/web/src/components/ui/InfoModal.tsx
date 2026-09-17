'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface InfoModalProps {
  otvoren: boolean;
  naslov: string;
  podnaslov?: string;
  onZatvori: () => void;
  children: ReactNode;
}

export function InfoModal({ otvoren, naslov, podnaslov, onZatvori, children }: InfoModalProps) {
  const [montiran, setMontiran] = useState(false);

  useEffect(() => {
    setMontiran(true);
  }, []);

  useEffect(() => {
    if (!otvoren) return;
    const naEskejp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onZatvori();
    };
    document.addEventListener('keydown', naEskejp);
    const prethodniOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', naEskejp);
      document.body.style.overflow = prethodniOverflow;
    };
  }, [otvoren, onZatvori]);

  if (!montiran || !otvoren) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-[rgba(42,51,69,0.45)] backdrop-blur-sm"
        onClick={onZatvori}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={naslov}
        className="relative w-full sm:max-w-md max-h-[85dvh] sm:max-h-[80dvh] overflow-y-auto neu-card rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 animate-[infoModalUp_0.22s_ease-out]"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--color-text)]">{naslov}</h2>
            {podnaslov && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{podnaslov}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onZatvori}
            title="Zatvori"
            className="neu-icon-circle w-9 h-9 shrink-0 text-[var(--color-text-muted)]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="text-sm text-[var(--color-text)] leading-relaxed space-y-3">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
