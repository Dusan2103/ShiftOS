'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Uloga } from '@shiftos/shared';
import { useAuthStore } from '@/lib/auth-store';
import { odrediRadnikOdrediste } from '@/lib/radnik-destinacija';
import { jeTerminalShiftFlavor } from '@/lib/platforma';
import { osiguajTerminalSesiju } from '@/lib/terminal-nalog';

export default function PocetnaStranica() {
  const router = useRouter();
  const korisnik = useAuthStore((s) => s.korisnik);
  const hidriran = useAuthStore((s) => s.hidriran);

  useEffect(() => {
    if (!hidriran) return;
    if (korisnik) {
      if (korisnik.uloga === Uloga.RADNIK) {
        router.replace(odrediRadnikOdrediste(korisnik));
      } else {
        router.replace('/panel');
      }
      return;
    }

    if (jeTerminalShiftFlavor()) {
      osiguajTerminalSesiju().then((uspesno) => router.replace(uspesno ? '/terminal' : '/login'));
      return;
    }

    router.replace('/login');
  }, [korisnik, hidriran, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <p className="text-[var(--color-text-muted)]">Učitavanje…</p>
    </div>
  );
}
