'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { Uloga } from '@shiftos/shared';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { api, ApiGreska } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { odrediRadnikOdrediste } from '@/lib/radnik-destinacija';
import { jeTerminalShiftFlavor } from '@/lib/platforma';
import { osiguajTerminalSesiju } from '@/lib/terminal-nalog';

interface PrijavaOdgovor {
  accessToken: string;
  korisnik: { id: string; email: string; uloga: Uloga; radnikId: string | null };
}

export default function LoginStranica() {
  const router = useRouter();
  const prijaviSe = useAuthStore((s) => s.prijaviSe);

  const [email, setEmail] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [prikaziLozinku, setPrikaziLozinku] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [ucitava, setUcitava] = useState(false);

  useEffect(() => {
    if (jeTerminalShiftFlavor()) {
      osiguajTerminalSesiju().then((uspesno) => router.replace(uspesno ? '/terminal' : '/login'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGreska(null);
    setUcitava(true);
    try {
      const odgovor = await api.post<PrijavaOdgovor>('/auth/login', { email, lozinka });
      prijaviSe(odgovor.accessToken, odgovor.korisnik);
      if (odgovor.korisnik.uloga === Uloga.RADNIK) {
        router.replace(odrediRadnikOdrediste(odgovor.korisnik));
      } else {
        router.replace('/panel');
      }
    } catch (err) {
      setGreska(
        err instanceof ApiGreska ? err.message : 'Greška pri povezivanju sa serverom.',
      );
    } finally {
      setUcitava(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <Logo size={40} wordmark className="mb-6" />
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Prijava</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          ShiftOS — kontrola pristupa sektorima pogona
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email adresa"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
            autoComplete="username"
          />
          <Input
            type={prikaziLozinku ? 'text' : 'password'}
            placeholder="Lozinka"
            value={lozinka}
            onChange={(e) => setLozinka(e.target.value)}
            icon={<Lock size={18} />}
            required
            autoComplete="current-password"
            rightSlot={
              <button
                type="button"
                onClick={() => setPrikaziLozinku((v) => !v)}
                className="text-[var(--color-text-muted)]"
                tabIndex={-1}
              >
                {prikaziLozinku ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="flex justify-end -mt-2">
            <button
              type="button"
              className="text-xs text-[var(--color-primary)] font-medium"
              onClick={() =>
                alert('Za resetovanje lozinke obratite se administratoru pogona.')
              }
            >
              Zaboravljena lozinka?
            </button>
          </div>

          {greska && (
            <div className="neu-inset rounded-2xl px-4 py-3 text-sm status-critical">
              {greska}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={ucitava} className="mt-2">
            {ucitava ? 'Prijavljivanje…' : 'Prijava'}
          </Button>

          <Link
            href="/registracija"
            className="text-center text-xs text-[var(--color-primary)] font-medium"
          >
            Nemate nalog? Registrujte se
          </Link>
        </form>
      </Card>
    </div>
  );
}
