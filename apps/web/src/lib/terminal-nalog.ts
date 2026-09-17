import { Uloga } from '@shiftos/shared';
import { api, ApiGreska } from './api';
import { useAuthStore } from './auth-store';

const TERMINAL_EMAIL = 'terminal@shiftos.rs';
const TERMINAL_LOZINKA = 'sifra123';

interface PrijavaOdgovor {
  accessToken: string;
  korisnik: { id: string; email: string; uloga: Uloga; radnikId: string | null };
}

export async function osiguajTerminalSesiju(): Promise<boolean> {
  if (useAuthStore.getState().korisnik) return true;
  return obnoviTerminalSesiju();
}

export async function obnoviTerminalSesiju(): Promise<boolean> {
  try {
    const odgovor = await api.post<PrijavaOdgovor>('/auth/login', {
      email: TERMINAL_EMAIL,
      lozinka: TERMINAL_LOZINKA,
    });
    useAuthStore.getState().prijaviSe(odgovor.accessToken, odgovor.korisnik);
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('TerminalShift auto-prijava neuspešna:', e instanceof ApiGreska ? e.message : e);
    return false;
  }
}
