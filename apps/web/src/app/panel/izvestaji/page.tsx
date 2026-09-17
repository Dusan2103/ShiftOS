'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { IzvestajSektoraDTO } from '@shiftos/shared';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { DonutChartCard } from '@/components/ui/DonutChartCard';
import { InfoModal } from '@/components/ui/InfoModal';
import { IconCircle } from '@/components/ui/IconCircle';
import { api } from '@/lib/api';

interface Objasnjenje {
  naslov: string;
  podnaslov?: string;
  sadrzaj: ReactNode;
}

const PERIODI = [
  { value: 'danas', label: 'Danas' },
  { value: '7dana', label: 'Poslednjih 7 dana' },
  { value: 'mesec', label: 'Poslednjih mesec dana' },
];

export default function IzvestajiStranica() {
  const [period, setPeriod] = useState('7dana');
  const [izvestaj, setIzvestaj] = useState<IzvestajSektoraDTO[]>([]);
  const [ucitava, setUcitava] = useState(true);
  const [objasnjenje, setObjasnjenje] = useState<Objasnjenje | null>(null);

  useEffect(() => {
    setUcitava(true);
    api
      .get<IzvestajSektoraDTO[]>(`/izvestaji?period=${period}`)
      .then(setIzvestaj)
      .finally(() => setUcitava(false));
  }, [period]);

  const prosecnaPokrivenost =
    izvestaj.length > 0 ? izvestaj.reduce((s, i) => s + i.pokrivenostPct, 0) / izvestaj.length : 0;
  const prosecnaUspesnost =
    izvestaj.length > 0 ? izvestaj.reduce((s, i) => s + i.stopaUspesnostiPct, 0) / izvestaj.length : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-lg font-bold text-[var(--color-text)]">Izveštaji</h1>
        <div className="w-full sm:w-56">
          <Dropdown value={period} onChange={setPeriod} options={PERIODI} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <DonutChartCard
          naslov="Prosečna pokrivenost"
          procenat={prosecnaPokrivenost}
          boja="#2E6BF0"
          onKlik={() =>
            setObjasnjenje({
              naslov: 'Prosečna pokrivenost',
              podnaslov: 'Vremenski ponderisano, ne trenutni snimak',
              sadrzaj: (
                <>
                  <p>
                    Prosek, preko svih sektora, procenta vremena u izabranom periodu tokom kojeg je
                    svaki sektor imao bar onoliko radnika koliko iznosi njegov minimum.
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    Za razliku od „Pokrivenost sektora” na Kontrolnoj tabli (koja gleda samo trenutno
                    stanje), ovde se posmatra cela vremenska linija ulazaka/izlazaka u periodu i meri
                    koliki procenat tog perioda je sektor bio pokriven minimumom.
                  </p>
                </>
              ),
            })
          }
        />
        <DonutChartCard
          naslov="Prosečna stopa uspešnosti"
          procenat={prosecnaUspesnost}
          boja="#34C77B"
          onKlik={() =>
            setObjasnjenje({
              naslov: 'Prosečna stopa uspešnosti',
              sadrzaj: (
                <p>
                  Prosek, preko svih sektora, procenta završenih zadataka u periodu koji su obavljeni
                  u roku od najviše 1.4× očekivanog trajanja tog zadatka (isti kriterijum kao
                  „Efikasnost” na Kontrolnoj tabli, samo agregiran po sektorima za izabrani period).
                </p>
              ),
            })
          }
        />
      </div>

      <Card className="p-0 overflow-x-auto">
        <div className="flex items-center justify-between gap-3 px-6 pt-6">
          <p className="text-xs text-[var(--color-text-muted)]">Detalji po sektoru</p>
          <IconCircle
            icon={<Info size={14} />}
            size={30}
            title="Objašnjenje kolona"
            onClick={() =>
              setObjasnjenje({
                naslov: 'Kolone u tabeli',
                sadrzaj: (
                  <>
                    <p>
                      <strong>Pokrivenost</strong> — vremenski ponderisan procenat perioda kada je
                      sektor imao bar minimalan broj radnika (isti princip kao donut grafikon iznad).
                    </p>
                    <p>
                      <strong>Broj zadataka</strong> — broj zadataka u periodu koji su i završeni
                      (imaju poznat ishod), zadaci još u toku se ne broje.
                    </p>
                    <p>
                      <strong>Stopa uspešnosti</strong> — procenat tih završenih zadataka obavljenih
                      u roku od najviše 1.4× očekivanog trajanja.
                    </p>
                    <p>
                      <strong>Prosečno odstupanje</strong> — prosečna razlika (u minutima) između
                      stvarnog i očekivanog trajanja. Pozitivna vrednost znači da je sektor u proseku
                      sporiji od očekivanog, negativna da je brži.
                    </p>
                  </>
                ),
              })
            }
          />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-text-muted)]">
              <th className="px-6 py-4 font-medium">Sektor</th>
              <th className="px-6 py-4 font-medium">Pokrivenost</th>
              <th className="px-6 py-4 font-medium">Broj zadataka</th>
              <th className="px-6 py-4 font-medium">Stopa uspešnosti</th>
              <th className="px-6 py-4 font-medium">Prosečno odstupanje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(163,177,198,0.25)]">
            {!ucitava && izvestaj.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-[var(--color-text-muted)]">
                  Nema podataka za izabrani period.
                </td>
              </tr>
            )}
            {izvestaj.map((i) => (
              <tr key={i.sektorId} className="text-[var(--color-text)]">
                <td className="px-6 py-4 font-medium">{i.naziv}</td>
                <td className="px-6 py-4">{i.pokrivenostPct}%</td>
                <td className="px-6 py-4">{i.brojZadataka}</td>
                <td className="px-6 py-4">{i.stopaUspesnostiPct}%</td>
                <td className="px-6 py-4">
                  {i.prosecnoOdstupanjeMin > 0 ? '+' : ''}
                  {i.prosecnoOdstupanjeMin} min
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

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
