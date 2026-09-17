import { randomUUID } from 'crypto';

const TRANSLITERACIJA: Record<string, string> = {
  č: 'c', ć: 'c', š: 's', ž: 'z', đ: 'dj',
  Č: 'c', Ć: 'c', Š: 's', Ž: 'z', Đ: 'dj',
};

function slug(deo: string): string {
  return deo
    .split('')
    .map((znak) => TRANSLITERACIJA[znak] ?? znak)
    .join('')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function generisiEmail(ime: string, prezime: string): string {
  const kratakId = randomUUID().replace(/-/g, '').slice(0, 6);
  return `${slug(ime)}.${slug(prezime)}.${kratakId}@shiftos.rs`;
}
