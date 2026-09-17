import { MIN_UZORAKA } from '../constants';
import { praznaStatistika } from './welford';
import { oceniIzlazak } from './detekcijaAnomalija';

describe('oceniIzlazak — algoritam detekcije anomalija', () => {
  it('vraća BEZ_OCENE dok se ne prikupi MIN_UZORAKA prethodnih poseta', () => {
    let stat = praznaStatistika();
    for (let i = 0; i < MIN_UZORAKA; i++) {
      const { rezultat, novaStatistika } = oceniIzlazak(15, stat);
      expect(rezultat.ocenjeno).toBe(false);
      stat = novaStatistika;
    }
    expect(stat.brojUzoraka).toBe(MIN_UZORAKA);
  });

  it('počinje da ocenjuje tek od (MIN_UZORAKA + 1)-ve posete', () => {
    let stat = praznaStatistika();
    for (let i = 0; i < MIN_UZORAKA; i++) {
      stat = oceniIzlazak(15, stat).novaStatistika;
    }
    const { rezultat } = oceniIzlazak(15, stat);
    expect(rezultat.ocenjeno).toBe(true);
  });

  it('ne označava anomaliju kad je trajanje blizu proseka', () => {
    let stat = praznaStatistika();
    const uobicajena = [14, 16, 15, 17, 16, 15];
    for (const t of uobicajena) {
      stat = oceniIzlazak(t, stat).novaStatistika;
    }
    const { rezultat } = oceniIzlazak(16, stat);
    expect(rezultat.ocenjeno).toBe(true);
    if (rezultat.ocenjeno) {
      expect(rezultat.anomalija).toBe(false);
    }
  });

  it('primer iz diplomskog rada (poglavlje 6.4): Marko, sektor "Pakovanje" — z ≈ 5.9, anomalija', () => {
    const stat = {
      brojUzoraka: 8,
      prosek: 16.4,
      m2: 1.8 ** 2 * 8,
    };

    const { rezultat } = oceniIzlazak(27, stat);
    expect(rezultat.ocenjeno).toBe(true);
    if (rezultat.ocenjeno) {
      expect(rezultat.zScore).toBeCloseTo(5.888, 2);
      expect(rezultat.anomalija).toBe(true);
    }
  });

  it('degenerisan slučaj: sva prethodna trajanja identična (devijacija 0)', () => {
    let stat = praznaStatistika();
    for (let i = 0; i < MIN_UZORAKA; i++) {
      stat = oceniIzlazak(20, stat).novaStatistika;
    }

    const jednako = oceniIzlazak(20, stat);
    expect(jednako.rezultat).toEqual({ ocenjeno: true, anomalija: false, zScore: 0 });

    const drugacije = oceniIzlazak(45, stat);
    expect(drugacije.rezultat.ocenjeno).toBe(true);
    if (drugacije.rezultat.ocenjeno) {
      expect(drugacije.rezultat.zScore).toBe(Number.POSITIVE_INFINITY);
      expect(drugacije.rezultat.anomalija).toBe(true);
    }
  });

  it('statistika se ažurira i kada ocena nije data (BEZ_OCENE)', () => {
    const { novaStatistika } = oceniIzlazak(20, praznaStatistika());
    expect(novaStatistika.brojUzoraka).toBe(1);
    expect(novaStatistika.prosek).toBe(20);
  });
});
