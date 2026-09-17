'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FileBarChart, Settings, LogOut, UserCheck, ShieldCheck, MonitorCog } from 'lucide-react';
import { Uloga } from '@shiftos/shared';
import { IconCircle } from '@/components/ui/IconCircle';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/auth-store';
import { odrediRadnikOdrediste } from '@/lib/radnik-destinacija';

const STAVKE = [
  { href: '/panel', label: 'Kontrolna tabla', icon: LayoutDashboard, uloge: [Uloga.NADZORNIK, Uloga.ADMINISTRATOR] },
  { href: '/panel/radnici', label: 'Radnici i zadaci', icon: Users, uloge: [Uloga.NADZORNIK, Uloga.ADMINISTRATOR] },
  { href: '/panel/izvestaji', label: 'Izveštaji', icon: FileBarChart, uloge: [Uloga.NADZORNIK, Uloga.ADMINISTRATOR] },
  { href: '/panel/nalozi', label: 'Nalozi na čekanju', icon: UserCheck, uloge: [Uloga.NADZORNIK, Uloga.ADMINISTRATOR] },
  { href: '/panel/nadzornici', label: 'Nadzornici', icon: ShieldCheck, uloge: [Uloga.ADMINISTRATOR] },
  { href: '/panel/terminali', label: 'Terminali', icon: MonitorCog, uloge: [Uloga.ADMINISTRATOR] },
  { href: '/panel/podesavanja', label: 'Podešavanja pogona', icon: Settings, uloge: [Uloga.ADMINISTRATOR] },
];

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const korisnik = useAuthStore((s) => s.korisnik);
  const hidriran = useAuthStore((s) => s.hidriran);
  const odjaviSe = useAuthStore((s) => s.odjaviSe);

  useEffect(() => {
    if (!hidriran) return;
    if (!korisnik) {
      router.replace('/login');
    } else if (korisnik.uloga === Uloga.RADNIK) {
      router.replace(odrediRadnikOdrediste(korisnik));
    }
  }, [korisnik, hidriran, router]);

  if (!korisnik || korisnik.uloga === Uloga.RADNIK) return null;

  const stavke = STAVKE.filter((s) => s.uloge.includes(korisnik.uloga));

  function odjava() {
    odjaviSe();
    router.replace('/login');
  }

  return (
    <div className="min-h-dvh flex flex-col sm:flex-row">
      {}
      <header className="sm:hidden sticky top-0 z-10 flex items-center gap-3 px-3 py-3 neu-raised-sm"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
      >
        <Logo size={30} />
        <nav className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0">
          {stavke.map((stavka) => {
            const Icon = stavka.icon;
            const aktivno = pathname === stavka.href || (stavka.href !== '/panel' && pathname.startsWith(stavka.href));
            return (
              <IconCircle
                key={stavka.href}
                icon={<Icon size={18} />}
                size={38}
                active={aktivno}
                onClick={() => router.push(stavka.href)}
                title={stavka.label}
                className="shrink-0"
              />
            );
          })}
        </nav>
      </header>

      <button
        type="button"
        onClick={odjava}
        title="Odjava"
        className="sm:hidden fixed left-4 z-20 neu-icon-circle w-12 h-12 text-[var(--color-text)]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <LogOut size={18} />
      </button>

      {}
      <aside className="hidden sm:flex w-20 md:w-24 shrink-0 flex-col items-center py-8 gap-6">
        <Logo size={40} />

        <nav className="flex flex-col gap-4 mt-6">
          {stavke.map((stavka) => {
            const Icon = stavka.icon;
            const aktivno = pathname === stavka.href || (stavka.href !== '/panel' && pathname.startsWith(stavka.href));
            return (
              <div key={stavka.href} className="flex flex-col items-center gap-1">
                <IconCircle
                  icon={<Icon size={20} />}
                  active={aktivno}
                  onClick={() => router.push(stavka.href)}
                  title={stavka.label}
                />
              </div>
            );
          })}
        </nav>

        <div className="mt-auto">
          <IconCircle icon={<LogOut size={18} />} title="Odjava" onClick={odjava} />
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-10 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] sm:pb-6 lg:pb-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="min-w-0">
              <p className="text-sm text-[var(--color-text-muted)]">Dobrodošli,</p>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text)] truncate">
                {korisnik.email}
              </h1>
            </div>
            <span className="neu-raised-sm rounded-full px-4 py-2 text-xs text-[var(--color-text-muted)] shrink-0">
              {korisnik.uloga === Uloga.ADMINISTRATOR ? 'Administrator' : 'Nadzornik'}
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
