'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, LogOut, User, ScanLine, ChevronRight } from 'lucide-react';
import { Uloga } from '@shiftos/shared';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { NaslovSaObjasnjenjem } from '@/components/ui/NaslovSaObjasnjenjem';
import { DnevnaTraka } from '@/components/radnici/DnevnaTraka';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface MojProfilOdgovor {
  id: string;
  ime: string;
  kvalifikacije: { kvalifikacija: { naziv: string } }[];
}

interface DodelaOdgovor {
  id: string;
  naziv: string;
  ocekivanoTrajanje: number;
  datum: string;
  sektor: { id: string; naziv: string };
}

interface PosetaIstorija {
  id: string;
  vremeUlaska: string;
  vremeIzlaska: string | null;
  anomalija: boolean;
  zScore: number | null;
  sektor: { id: string; naziv: string };
  zadatak: {
    naziv: string;
    ocekivanoTrajanje: number;
    stvarnoTrajanje: number | null;
    ishod: string | null;
  } | null;
}

export default function MojProfilStranica() {
  const router = useRouter();
  const korisnik = useAuthStore((s) => s.korisnik);
  const hidriran = useAuthStore((s) => s.hidriran);
  const odjaviSe = useAuthStore((s) => s.odjaviSe);

  const [profil, setProfil] = useState<MojProfilOdgovor | null>(null);
  const [zadaci, setZadaci] = useState<DodelaOdgovor[]>([]);
  const [istorija, setIstorija] = useState<PosetaIstorija[]>([]);

  useEffect(() => {
    if (!hidriran) return;
    if (!korisnik) {
      router.replace('/login');
      return;
    }
    if (korisnik.uloga !== Uloga.RADNIK) {
      router.replace('/panel');
      return;
    }
    if (!korisnik.radnikId) {
      router.replace('/terminal');
      return;
    }

    api.get<MojProfilOdgovor>('/radnici/me').then(setProfil).catch(() => {});
    api.get<DodelaOdgovor[]>('/dodele/me').then(setZadaci).catch(() => {});
    api.get<PosetaIstorija[]>('/radnici/me/istorija').then(setIstorija).catch(() => {});
  }, [korisnik, hidriran, router]);

  if (!korisnik || korisnik.uloga !== Uloga.RADNIK) return null;

  return (
    <div className="min-h-dvh px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-10 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]">
      <div className="max-w-3xl mx-auto w-full">
        <Logo size={32} className="mb-4 sm:mb-6" />
        <header className="flex items-center gap-4 mb-6 sm:mb-8 min-w-0">
          <div className="neu-icon-circle w-12 h-12 text-[var(--color-primary)] shrink-0">
            <User size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-[var(--color-text-muted)]">Moj profil</p>
            <h1 className="text-xl font-bold text-[var(--color-text)] truncate">
              {profil?.ime ?? korisnik.email}
            </h1>
          </div>
        </header>

        <Card
          className="mb-6 cursor-pointer flex items-center justify-between hover:brightness-[0.98]"
          onClick={() => router.push('/moj-profil/prijava-na-sektor')}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="neu-icon-circle w-11 h-11 text-[var(--color-primary)] shrink-0">
              <ScanLine size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--color-text)]">Prijava na sektor</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Skenirajte QR kod ili NFC sa terminala na vratima sektora
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--color-text-muted)] shrink-0 ml-2" />
        </Card>

        <Card className="mb-6">
          <h2 className="font-semibold text-[var(--color-text)] mb-3">Kvalifikacije</h2>
          <div className="flex flex-wrap gap-2">
            {profil && profil.kvalifikacije.length > 0 ? (
              profil.kvalifikacije.map((k, i) => (
                <span
                  key={i}
                  className="neu-raised-sm rounded-full px-3 py-1.5 text-xs text-[var(--color-text)]"
                >
                  {k.kvalifikacija.naziv}
                </span>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Nema dodeljenih kvalifikacija.</p>
            )}
          </div>
        </Card>

        <Card className="mb-6 p-0 overflow-hidden">
          <h2 className="font-semibold text-[var(--color-text)] px-4 sm:px-6 pt-6 pb-2 flex items-center gap-2">
            <ClipboardList size={18} className="text-[var(--color-primary)]" />
            Moji zadaci
          </h2>
          <div className="divide-y divide-[rgba(163,177,198,0.25)]">
            {zadaci.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] px-4 sm:px-6 py-4">
                Nema dodeljenih zadataka — dodeljeni zadatak od nadzornika prikazuje se ovde,
                inače se pri ulasku bira nasumičan zadatak iz kataloga sektora.
              </p>
            )}
            {zadaci.map((z) => (
              <div key={z.id} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)]">{z.naziv}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {z.sektor.naziv} · očekivano {z.ocekivanoTrajanje} min ·{' '}
                    {new Date(z.datum).toLocaleDateString('sr-RS')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <NaslovSaObjasnjenjem naslov="Kretanje kroz sektore — danas" className="mb-4">
            <p>
              Traka prikazuje vremenski period 00:00–24:00, a svaki obojeni deo je jedan vaš boravak
              u sektoru danas (širina = trajanje, boja = sektor).
            </p>
            <p className="text-[var(--color-text-muted)]">
              Crveni obrub oko segmenta znači da je taj izlazak označen kao statistička anomalija —
              trajanje je bilo neuobičajeno dugo u poređenju sa istorijskim prosekom tog sektora.
            </p>
          </NaslovSaObjasnjenjem>
          {istorija.length > 0 ? (
            <DnevnaTraka
              segmenti={istorija.map((p) => ({
                sektorId: p.sektor.id,
                sektorNaziv: p.sektor.naziv,
                vremeUlaska: p.vremeUlaska,
                vremeIzlaska: p.vremeIzlaska,
                anomalija: p.anomalija,
              }))}
            />
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">Nema evidentiranih poseta danas.</p>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <h2 className="font-semibold text-[var(--color-text)] px-4 sm:px-6 pt-6 pb-2">Istorija zadataka</h2>
          <div className="divide-y divide-[rgba(163,177,198,0.25)]">
            {istorija.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] px-4 sm:px-6 py-4">Nema zadataka danas.</p>
            )}
            {istorija.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {p.sektor.naziv} {p.zadatak ? `— ${p.zadatak.naziv}` : ''}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(p.vremeUlaska).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                    {p.vremeIzlaska &&
                      ` – ${new Date(p.vremeIzlaska).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}`}
                    {p.zadatak?.stvarnoTrajanje != null &&
                      ` · ${p.zadatak.stvarnoTrajanje} min (očekivano ${p.zadatak.ocekivanoTrajanje} min)`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {p.anomalija && (
                    <span className="text-xs font-semibold status-warning neu-raised-sm rounded-full px-3 py-1">
                      Anomalija{p.zScore != null ? ` (z=${p.zScore.toFixed(1)})` : ''}
                    </span>
                  )}
                  {p.zadatak?.ishod && (
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 neu-raised-sm ${
                        p.zadatak.ishod === 'USPESNO' ? 'status-success' : 'status-critical'
                      }`}
                    >
                      {p.zadatak.ishod === 'USPESNO' ? 'Uspešno' : 'Neuspešno'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <button
        type="button"
        onClick={() => {
          odjaviSe();
          router.replace('/login');
        }}
        title="Odjava"
        className="fixed left-4 z-20 neu-icon-circle w-12 h-12 text-[var(--color-text)]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
