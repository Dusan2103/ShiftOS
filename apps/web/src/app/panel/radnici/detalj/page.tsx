'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import { Uloga } from '@shiftos/shared';
import { Card } from '@/components/ui/Card';
import { NaslovSaObjasnjenjem } from '@/components/ui/NaslovSaObjasnjenjem';
import { DnevnaTraka } from '@/components/radnici/DnevnaTraka';
import { DodelaZadatkaKartica } from '@/components/radnici/DodelaZadatkaKartica';
import { NfcKarticaKartica } from '@/components/radnici/NfcKarticaKartica';
import { IconCircle } from '@/components/ui/IconCircle';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface RadnikDetalj {
  id: string;
  ime: string;
  nfcTagId: string | null;
  kvalifikacije: { kvalifikacija: { naziv: string } }[];
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

export default function RadnikDetaljStranica() {
  return (
    <Suspense fallback={null}>
      <RadnikDetaljSadrzaj />
    </Suspense>
  );
}

function RadnikDetaljSadrzaj() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const router = useRouter();
  const korisnik = useAuthStore((s) => s.korisnik);
  const [radnik, setRadnik] = useState<RadnikDetalj | null>(null);
  const [istorija, setIstorija] = useState<PosetaIstorija[]>([]);

  function osveziRadnika() {
    if (!id) return;
    api.get<RadnikDetalj>(`/radnici/${id}`).then(setRadnik).catch(() => {});
  }

  useEffect(() => {
    if (!id) return;
    osveziRadnika();
    api
      .get<PosetaIstorija[]>(`/radnici/${id}/istorija`)
      .then(setIstorija)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <IconCircle icon={<ArrowLeft size={18} />} onClick={() => router.back()} title="Nazad" />
        <div className="neu-icon-circle w-11 h-11 text-[var(--color-primary)]">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">{radnik?.ime ?? '…'}</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {radnik?.kvalifikacije.map((k) => k.kvalifikacija.naziv).join(', ') || 'Bez kvalifikacija'}
          </p>
        </div>
      </div>

      {id && (
        <>
          <NfcKarticaKartica
            radnikId={id}
            nfcTagId={radnik?.nfcTagId ?? null}
            mozeDaMenja={korisnik?.uloga === Uloga.ADMINISTRATOR}
            onPromena={osveziRadnika}
          />
          <DodelaZadatkaKartica radnikId={id} />
        </>
      )}

      <Card className="mb-6">
        <NaslovSaObjasnjenjem naslov="Kretanje kroz sektore — danas" className="mb-4">
          <p>
            Traka prikazuje vremenski period 00:00–24:00, a svaki obojeni deo je jedan boravak
            radnika u sektoru danas (širina = trajanje, boja = sektor).
          </p>
          <p className="text-[var(--color-text-muted)]">
            Crveni obrub oko segmenta znači da je taj izlazak označen kao statistička anomalija —
            trajanje je bilo neuobičajeno dugo u poređenju sa istorijskim prosekom tog sektora
            (z-skor &gt; 1.8, videti objašnjenje na kartici „Anomalija danas” na Kontrolnoj tabli).
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
            <p className="text-sm text-[var(--color-text-muted)] px-4 sm:px-6 py-4">Nema zadataka.</p>
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
  );
}
