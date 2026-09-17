import { izracunajPokrivenostPct } from './pokrivenost-perioda.util';

const periodOd = new Date('2026-01-01T08:00:00Z');
const periodDo = new Date('2026-01-01T16:00:00Z');

function d(sat: number, minut = 0): Date {
  return new Date(`2026-01-01T${String(sat).padStart(2, '0')}:${String(minut).padStart(2, '0')}:00Z`);
}

describe('izracunajPokrivenostPct', () => {
  it('vraća 100% kada minimum nikad nije narušen (dva radnika ceo period, minimum=2)', () => {
    const posete = [
      { vremeUlaska: d(8), vremeIzlaska: d(16) },
      { vremeUlaska: d(8), vremeIzlaska: d(16) },
    ];
    expect(izracunajPokrivenostPct(posete, 2, periodOd, periodDo)).toBeCloseTo(100, 5);
  });

  it('vraća 0% kada nema nijedne posete, a minimum > 0', () => {
    expect(izracunajPokrivenostPct([], 1, periodOd, periodDo)).toBe(0);
  });

  it('minimum=0 je uvek pokriveno (100%), bez obzira na posete', () => {
    expect(izracunajPokrivenostPct([], 0, periodOd, periodDo)).toBe(100);
  });

  it('računa tačan procenat za delimičnu pokrivenost (minimum=2, pokriveno pola perioda)', () => {
    const posete = [
      { vremeUlaska: d(8), vremeIzlaska: d(16) },
      { vremeUlaska: d(8), vremeIzlaska: d(12) },
    ];
    expect(izracunajPokrivenostPct(posete, 2, periodOd, periodDo)).toBeCloseTo(50, 5);
  });

  it('otvorena poseta (vremeIzlaska=null) se računa do kraja perioda', () => {
    const posete = [
      { vremeUlaska: d(8), vremeIzlaska: null },
      { vremeUlaska: d(8), vremeIzlaska: null },
    ];
    expect(izracunajPokrivenostPct(posete, 2, periodOd, periodDo)).toBeCloseTo(100, 5);
  });

  it('poseta koja počinje pre perioda i završava se unutar njega se seče na granicu perioda', () => {
    const posete = [
      { vremeUlaska: d(6), vremeIzlaska: d(16) },
      { vremeUlaska: d(8), vremeIzlaska: d(16) },
    ];
    expect(izracunajPokrivenostPct(posete, 2, periodOd, periodDo)).toBeCloseTo(100, 5);
  });

  it('vraća 0 za nevalidan (obrnut ili nulti) period', () => {
    expect(izracunajPokrivenostPct([], 1, periodDo, periodOd)).toBe(0);
    expect(izracunajPokrivenostPct([], 1, periodOd, periodOd)).toBe(0);
  });
});
