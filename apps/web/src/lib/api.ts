'use client';

import { Uloga } from '@shiftos/shared';
import { useAuthStore } from './auth-store';
import { jeAndroidApp } from './platforma';

function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return `http://${window.location.hostname}:3001`;
  return 'http://localhost:3001';
}

const API_URL = resolveApiUrl();

export class ApiGreska extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function zahtev<T>(putanja: string, opcije: RequestInit = {}, ponovljen = false): Promise<T> {
  const { accessToken: token, korisnik, odjaviSe } = useAuthStore.getState();

  const odgovor = await fetch(`${API_URL}${putanja}`, {
    ...opcije,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      ...(jeAndroidApp() ? { 'X-Client-Platform': 'android' } : {}),
      ...opcije.headers,
    },
  });

  if (odgovor.status === 401 && token && !ponovljen && !putanja.startsWith('/auth/')) {
    if (korisnik?.uloga === Uloga.RADNIK && !korisnik.radnikId) {
      const { obnoviTerminalSesiju } = await import('./terminal-nalog');
      if (await obnoviTerminalSesiju()) return zahtev<T>(putanja, opcije, true);
    } else {
      odjaviSe();
    }
  }

  if (!odgovor.ok) {
    const telo = await odgovor.json().catch(() => ({ message: odgovor.statusText }));
    throw new ApiGreska(telo.message ?? 'Greška na serveru', odgovor.status);
  }

  if (odgovor.status === 204) return undefined as T;
  return odgovor.json();
}

export const api = {
  get: <T>(putanja: string) => zahtev<T>(putanja),
  post: <T>(putanja: string, telo?: unknown) =>
    zahtev<T>(putanja, { method: 'POST', body: telo ? JSON.stringify(telo) : undefined }),
  put: <T>(putanja: string, telo?: unknown) =>
    zahtev<T>(putanja, { method: 'PUT', body: telo ? JSON.stringify(telo) : undefined }),
  delete: <T>(putanja: string) => zahtev<T>(putanja, { method: 'DELETE' }),
};

export { API_URL };
