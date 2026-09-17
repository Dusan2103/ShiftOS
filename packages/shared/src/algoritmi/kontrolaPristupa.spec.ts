import { RazlogOdbijanja } from '../enums';
import { pokusajUlaska } from './kontrolaPristupa';

const QC = 'kval-qc';
const PAKOVANJE = 'kval-pakovanje';

describe('pokusajUlaska — algoritam kontrole pristupa', () => {
  it('odobrava ulazak kada radnik ima kvalifikaciju i sektor nije na kapacitetu', () => {
    const rezultat = pokusajUlaska({
      radnikKvalifikacijeIds: [QC],
      sektor: { id: 's1', potrebnaKvalifikacijaId: QC, kapacitet: 2 },
      brojTrenutnoUSektoru: 1,
    });
    expect(rezultat).toEqual({ odobreno: true });
  });

  it('odbija ulazak ako radniku nedostaje potrebna kvalifikacija', () => {
    const rezultat = pokusajUlaska({
      radnikKvalifikacijeIds: [PAKOVANJE],
      sektor: { id: 's1', potrebnaKvalifikacijaId: QC, kapacitet: 2 },
      brojTrenutnoUSektoru: 0,
    });
    expect(rezultat).toEqual({
      odobreno: false,
      razlog: RazlogOdbijanja.NEDOSTAJE_KVALIFIKACIJA,
    });
  });

  it('odbija ulazak kada je sektor tačno na kapacitetu (granični slučaj, >=)', () => {
    const rezultat = pokusajUlaska({
      radnikKvalifikacijeIds: [QC],
      sektor: { id: 's1', potrebnaKvalifikacijaId: QC, kapacitet: 2 },
      brojTrenutnoUSektoru: 2,
    });
    expect(rezultat).toEqual({
      odobreno: false,
      razlog: RazlogOdbijanja.KAPACITET_POPUNJEN,
    });
  });

  it('odobrava ulazak tačno jedno mesto ispod kapaciteta (granični slučaj)', () => {
    const rezultat = pokusajUlaska({
      radnikKvalifikacijeIds: [QC],
      sektor: { id: 's1', potrebnaKvalifikacijaId: QC, kapacitet: 2 },
      brojTrenutnoUSektoru: 1,
    });
    expect(rezultat.odobreno).toBe(true);
  });

  it('provera kvalifikacije ima prednost nad proverom kapaciteta', () => {
    const rezultat = pokusajUlaska({
      radnikKvalifikacijeIds: [],
      sektor: { id: 's1', potrebnaKvalifikacijaId: QC, kapacitet: 5 },
      brojTrenutnoUSektoru: 0,
    });
    expect(rezultat).toEqual({
      odobreno: false,
      razlog: RazlogOdbijanja.NEDOSTAJE_KVALIFIKACIJA,
    });
  });

  it('scenario iz diplomskog rada (poglavlje 6.3): treći kvalifikovan radnik se odbija na kapacitetu 2', () => {
    const nikola = pokusajUlaska({
      radnikKvalifikacijeIds: [QC],
      sektor: { id: 'kontrola-kvaliteta', potrebnaKvalifikacijaId: QC, kapacitet: 2 },
      brojTrenutnoUSektoru: 2,
    });
    expect(nikola).toEqual({ odobreno: false, razlog: RazlogOdbijanja.KAPACITET_POPUNJEN });

    const nikolaPonovo = pokusajUlaska({
      radnikKvalifikacijeIds: [QC],
      sektor: { id: 'kontrola-kvaliteta', potrebnaKvalifikacijaId: QC, kapacitet: 2 },
      brojTrenutnoUSektoru: 1,
    });
    expect(nikolaPonovo).toEqual({ odobreno: true });
  });
});
