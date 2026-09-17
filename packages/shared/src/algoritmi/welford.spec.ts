import { azurirajStatistiku, praznaStatistika, standardnaDevijacija } from './welford';

function direktnoIzracunaj(uzorci: number[]) {
  const prosek = uzorci.reduce((a, b) => a + b, 0) / uzorci.length;
  const varijansa =
    uzorci.reduce((suma, x) => suma + (x - prosek) ** 2, 0) / uzorci.length;
  return { prosek, stdev: Math.sqrt(varijansa) };
}

describe('Welfordov metod — inkrementalna statistika', () => {
  it('poklapa se sa direktnim (batch) izračunavanjem proseka i populacione devijacije', () => {
    const uzorci = [10, 12, 14, 16, 18, 30, 11, 9, 22];
    let stat = praznaStatistika();
    for (const x of uzorci) {
      stat = azurirajStatistiku(stat, x);
    }

    const direktno = direktnoIzracunaj(uzorci);
    expect(stat.prosek).toBeCloseTo(direktno.prosek, 10);
    expect(standardnaDevijacija(stat)).toBeCloseTo(direktno.stdev, 10);
    expect(stat.brojUzoraka).toBe(uzorci.length);
  });

  it('prosek jednog uzorka jednak je samom uzorku, devijacija je 0', () => {
    const stat = azurirajStatistiku(praznaStatistika(), 42);
    expect(stat.prosek).toBe(42);
    expect(standardnaDevijacija(stat)).toBe(0);
  });

  it('prazna statistika ima prosek i devijaciju 0', () => {
    const stat = praznaStatistika();
    expect(stat.brojUzoraka).toBe(0);
    expect(standardnaDevijacija(stat)).toBe(0);
  });
});
