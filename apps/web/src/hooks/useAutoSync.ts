'use client';

import { useEffect, useRef, useState } from 'react';
import { sinhronizujRed } from '@/lib/sync';

const INTERVAL_MS = 15_000;

export function useAutoSync() {
  const [online, setOnline] = useState(true);
  const uToku = useRef(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    const pokusaj = async () => {
      if (uToku.current || !navigator.onLine) return;
      uToku.current = true;
      try {
        await sinhronizujRed();
      } catch {
      } finally {
        uToku.current = false;
      }
    };

    const naOnline = () => {
      setOnline(true);
      pokusaj();
    };
    const naOffline = () => setOnline(false);

    window.addEventListener('online', naOnline);
    window.addEventListener('offline', naOffline);
    const interval = setInterval(pokusaj, INTERVAL_MS);
    pokusaj();

    return () => {
      window.removeEventListener('online', naOnline);
      window.removeEventListener('offline', naOffline);
      clearInterval(interval);
    };
  }, []);

  return { online };
}
