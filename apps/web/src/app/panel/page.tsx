'use client';

import { ReactNode, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Gauge } from 'lucide-react';
import { DogadjajDTO, KpiDTO, SektorPokrivenostDTO, StatusPokrivenosti } from '@shiftos/shared';
import { Card } from '@/components/ui/Card';
import { LineChartCard } from '@/components/ui/LineChartCard';
import { DonutChartCard } from '@/components/ui/DonutChartCard';
import { InfoModal } from '@/components/ui/InfoModal';
import { InfoOznaka } from '@/components/ui/InfoOznaka';
import { api } from '@/lib/api';
import { clsx } from '@/lib/clsx';

const POLL_MS = 10_000;

const STATUS_BOJA: Record<StatusPokrivenosti, string> = {
  [StatusPokrivenosti.POKRIVEN]: 'bg-status-success',
  [StatusPokrivenosti.NEDOVOLJNO]: 'bg-status-warning',
  [StatusPokrivenosti.PRAZAN]: 'bg-status-critical',
};

const DOGADJAJ_TEKST: Record<string, string> = {
  ULAZAK_ODOBREN: 'Ulazak odobren',
  ULAZAK_ODBIJEN: 'Ulazak odbijen',
  IZLAZAK: 'Izlazak',
  ANOMALIJA: 'Anomalija',
};

function StatKartica({
  ikonica,
  naslov,
  vrednost,
  boja,
  onKlik,
}: {
  ikonica: React.ReactNode;
  naslov: string;
  vrednost: string;
  boja?: string;
  onKlik?: () => void;
}) {
  return (
    <Card
      className={clsx(
        'relative flex items-center gap-4',
        onKlik && 'cursor-pointer transition hover:brightness-[0.98] active:scale-[0.99]',
      )}
      onClick={onKlik}
      role={onKlik ? 'button' : undefined}
      tabIndex={onKlik ? 0 : undefined}
      onKeyDown={
        onKlik
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onKlik();
              }
            }
          : undefined
      }
    >
      {onKlik && <InfoOznaka />}
      <div className={`neu-icon-circle w-12 h-12 shrink-0 ${boja ?? 'text-[var(--color-primary)]'}`}>
        {ikonica}
      </div>
      <div>
        <p className="text-sm text-[var(--color-text-muted)]">{naslov}</p>
        <p className="text-2xl font-bold text-[var(--color-text)]">{vrednost}</p>
      </div>
    </Card>
  );
}

interface Objasnjenje {
  naslov: string;
  podnaslov?: string;
  sadrzaj: ReactNode;
}

const STATUS_OPIS: Record<StatusPokrivenosti, string> = {
  [StatusPokrivenosti.POKRIVEN]: 'zeleno — trenutno ima dovoljno radnika (≥ minimum)',
  [StatusPokrivenosti.NEDOVOLJNO]: 'žuto — ima radnika, ali manje od minimuma',
  [StatusPokrivenosti.PRAZAN]: 'crveno — sektor je trenutno prazan, a minimum je > 0',
};

export default function KontrolnaTabla() {
  const [kpi, setKpi] = useState<KpiDTO | null>(null);
  const [sektori, setSektori] = useState<SektorPokrivenostDTO[]>([]);
  const [trend, setTrend] = useState<{ label: string; value: number }[]>([]);
  const [dnevnik, setDnevnik] = useState<DogadjajDTO[]>([]);
  const [objasnjenje, setObjasnjenje] = useState<Objasnjenje | null>(null);

  useEffect(() => {
    let aktivno = true;

    const osvezi = () => {
      Promise.all([
        api.get<KpiDTO>('/dashboard/kpi'),
        api.get<SektorPokrivenostDTO[]>('/sektori/pokrivenost'),
        api.get<{ label: string; value: number }[]>('/dashboard/trend'),
        api.get<DogadjajDTO[]>('/dashboard/dnevnik?limit=20'),
      ]).then(([k, s, t, d]) => {
        if (!aktivno) return;
        setKpi(k);
        setSektori(s);
        setTrend(t);
        setDnevnik(d);
      }).catch(() => {});
    };

    osvezi();
    const interval = setInterval(osvezi, POLL_MS);
    return () => {
      aktivno = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatKartica
          ikonica={<Gauge size={20} />}
          naslov="Efikasnost"
          vrednost={kpi ? `${kpi.efikasnostPct}%` : '—'}
          onKlik={() =>
            setObjasnjenje({
              naslov: 'Efikasnost',
              podnaslov: 'Kako se računa',
              sadrzaj: (
                <>
                  <p>
                    Procenat zadataka <strong>završenih danas</strong> koji su obavljeni u
                    prihvatljivom roku — stvarno trajanje nije prešlo očekivano trajanje pomnoženo
                    faktorom uspešnosti od <strong>1.4</strong> (40% tolerancije).
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    Formula: (broj uspešnih / broj završenih) × 100. Zadaci koji su još u toku
                    (radnik je i dalje u sektoru) se ne računaju dok se ne evidentira izlazak.
                  </p>
                </>
              ),
            })
          }
        />
        <StatKartica
          ikonica={<CheckCircle2 size={20} />}
          naslov="Pokrivenost sektora"
          vrednost={kpi ? `${kpi.pokrivenoSektora}/${kpi.ukupnoSektora}` : '—'}
          onKlik={() =>
            setObjasnjenje({
              naslov: 'Pokrivenost sektora',
              podnaslov: 'Trenutno stanje, ne istorijski prosek',
              sadrzaj: (
                <>
                  <p>
                    Broj sektora koji <strong>upravo sada</strong> imaju bar onoliko radnika
                    koliko je postavljeno kao minimum za taj sektor (podešava se u „Podešavanja
                    pogona&nbsp;→&nbsp;Sektori i zadaci”).
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    Ovo je trenutni snimak (instant provera), za razliku od „Prosečne pokrivenosti”
                    na stranici Izveštaji, koja meri pokrivenost tokom celog vremenskog perioda.
                  </p>
                </>
              ),
            })
          }
        />
        <StatKartica
          ikonica={<ClipboardList size={20} />}
          naslov="Zadataka danas"
          vrednost={kpi ? String(kpi.zadatakaDanas) : '—'}
          onKlik={() =>
            setObjasnjenje({
              naslov: 'Zadataka danas',
              sadrzaj: (
                <p>
                  Broj zadataka koji su generisani od početka dana — svaki ulazak radnika u sektor
                  koji ima kataloške zadatke (ili dodeljen poseban zadatak od nadzornika) otvara
                  jedan zadatak. Broji se i dalje aktivne (nezavršene) zadatke.
                </p>
              ),
            })
          }
        />
        <StatKartica
          ikonica={<AlertTriangle size={20} />}
          naslov="Anomalija danas"
          vrednost={kpi ? String(kpi.anomalijaDanas) : '—'}
          boja={kpi && kpi.anomalijaDanas > 0 ? 'status-warning' : undefined}
          onKlik={() =>
            setObjasnjenje({
              naslov: 'Anomalija danas',
              podnaslov: 'Adaptivna statistička detekcija (Welford + z-skor)',
              sadrzaj: (
                <>
                  <p>
                    Broj izlazaka danas gde je trajanje boravka u sektoru statistički neuobičajeno
                    dugo <strong>za taj konkretan sektor</strong> — ne postoji jedan univerzalni
                    prag u minutima.
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    Sistem po sektoru vodi tekući prosek i standardnu devijaciju trajanja (Welford
                    algoritam, ažurira se posle svakog izlaska). Za svaki novi izlazak računa se
                    z-skor = (trajanje − prosek) / devijacija. Ako je z-skor veći od{' '}
                    <strong>1.8</strong> — i ako sektor već ima bar 5 prethodnih merenja — izlazak
                    se označava kao anomalija.
                  </p>
                </>
              ),
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <LineChartCard
            naslov="Zadataka po danu"
            podnaslov="Poslednjih 7 dana"
            vrednost={trend.reduce((s, t) => s + t.value, 0)}
            podaci={trend}
            onKlik={() =>
              setObjasnjenje({
                naslov: 'Zadataka po danu',
                podnaslov: 'Poslednjih 7 dana',
                sadrzaj: (
                  <p>
                    Broj zadataka pokrenutih svakog od poslednjih 7 dana (uključujući danas),
                    grupisano po kalendarskom danu ulaska radnika u sektor. Koristan je za uočavanje
                    dnevnih obrazaca opterećenja pogona — npr. vikendom obično ima manje aktivnosti.
                  </p>
                ),
              })
            }
          />
        </div>
        <DonutChartCard
          naslov="Efikasnost danas"
          procenat={kpi?.efikasnostPct ?? 0}
          napomena="uspešnih zadataka"
          onKlik={() =>
            setObjasnjenje({
              naslov: 'Efikasnost danas',
              sadrzaj: (
                <p>
                  Ista metrika kao kartica „Efikasnost” na vrhu — procenat danas završenih zadataka
                  koji su obavljeni u roku od najviše 1.4× očekivanog trajanja, prikazan kao krug
                  radi bržeg vizuelnog uvida.
                </p>
              ),
            })
          }
        />
      </div>

      <div>
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Status sektora</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sektori.map((s) => (
            <Card
              key={s.sektorId}
              className="relative cursor-pointer transition hover:brightness-[0.98] active:scale-[0.99]"
              role="button"
              tabIndex={0}
              onClick={() =>
                setObjasnjenje({
                  naslov: s.naziv,
                  podnaslov: 'Status pokrivenosti sektora',
                  sadrzaj: (
                    <>
                      <p>
                        Trenutno u sektoru: <strong>{s.trenutnoPrisutnih}</strong> od kapaciteta{' '}
                        <strong>{s.kapacitet}</strong>. Minimum za pokrivenost:{' '}
                        <strong>{s.minimum}</strong>.
                      </p>
                      <p className="text-[var(--color-text-muted)]">
                        Boja statusa: {STATUS_OPIS[s.status]}. Kapacitet ograničava koliko radnika
                        terminal dozvoljava da uđe; minimum je prag ispod kojeg se sektor smatra
                        nedovoljno pokrivenim.
                      </p>
                    </>
                  ),
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
            >
              <InfoOznaka />
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[var(--color-text)]">{s.naziv}</p>
                <span className={`status-dot ${STATUS_BOJA[s.status]}`} />
              </div>
              <p className="text-3xl font-bold text-[var(--color-text)]">
                {s.trenutnoPrisutnih}
                <span className="text-base font-normal text-[var(--color-text-muted)]">
                  {' '}
                  / {s.kapacitet}
                </span>
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                minimum za pokrivenost: {s.minimum}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Dnevnik događaja</h2>
        <Card className="p-0 overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-[rgba(163,177,198,0.25)]">
            {dnevnik.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] p-6">Nema događaja.</p>
            )}
            {dnevnik.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {DOGADJAJ_TEKST[d.tip] ?? d.tip}{' '}
                    <span className="text-[var(--color-text-muted)] font-normal">
                      — {d.radnikIme} · {d.sektorNaziv}
                    </span>
                  </p>
                  {d.detalji && <p className="text-xs text-[var(--color-text-muted)]">{d.detalji}</p>}
                </div>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                  {new Date(d.vreme).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <InfoModal
        otvoren={!!objasnjenje}
        naslov={objasnjenje?.naslov ?? ''}
        podnaslov={objasnjenje?.podnaslov}
        onZatvori={() => setObjasnjenje(null)}
      >
        {objasnjenje?.sadrzaj}
      </InfoModal>
    </div>
  );
}
