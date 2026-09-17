'use client';

import { ReactNode, useState } from 'react';
import { Info } from 'lucide-react';
import { IconCircle } from './IconCircle';
import { InfoModal } from './InfoModal';

interface NaslovSaObjasnjenjemProps {
  naslov: string;
  className?: string;
  children: ReactNode;
}

export function NaslovSaObjasnjenjem({ naslov, className, children }: NaslovSaObjasnjenjemProps) {
  const [otvoren, setOtvoren] = useState(false);

  return (
    <div className={`flex items-center justify-between gap-3 ${className ?? ''}`}>
      <h2 className="font-semibold text-[var(--color-text)]">{naslov}</h2>
      <IconCircle
        icon={<Info size={13} />}
        size={28}
        title="Objašnjenje"
        onClick={() => setOtvoren(true)}
      />
      <InfoModal otvoren={otvoren} naslov={naslov} onZatvori={() => setOtvoren(false)}>
        {children}
      </InfoModal>
    </div>
  );
}
