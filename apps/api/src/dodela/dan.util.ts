export function pocetakDana(datum: Date | string): Date {
  const d = new Date(datum);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
