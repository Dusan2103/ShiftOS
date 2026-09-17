'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Uloga } from '@shiftos/shared';

export interface PrijavljenKorisnik {
  id: string;
  email: string;
  uloga: Uloga;
  radnikId: string | null;
}

interface AuthState {
  accessToken: string | null;
  korisnik: PrijavljenKorisnik | null;
  hidriran: boolean;
  prijaviSe: (accessToken: string, korisnik: PrijavljenKorisnik) => void;
  odjaviSe: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      korisnik: null,
      hidriran: false,
      prijaviSe: (accessToken, korisnik) => set({ accessToken, korisnik }),
      odjaviSe: () => set({ accessToken: null, korisnik: null }),
    }),
    {
      name: 'shiftos-auth',
      partialize: (state) => ({ accessToken: state.accessToken, korisnik: state.korisnik }),
    },
  ),
);

if (typeof window !== 'undefined') {
  const oznaciHidrirano = () => useAuthStore.setState({ hidriran: true });
  useAuthStore.persist.onFinishHydration(oznaciHidrirano);
  if (useAuthStore.persist.hasHydrated()) oznaciHidrirano();
}
