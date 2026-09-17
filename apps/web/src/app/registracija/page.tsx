'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { api, ApiGreska } from '@/lib/api';

interface RegistracijaOdgovor {
  email: string;
  status: string;
}

export default function RegistracijaStranica() {
  const [ime, setIme] = useState('');
  const [prezime, setPrezime] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [potvrdaLozinke, setPotvrdaLozinke] = useState('');
  const [prikaziLozinku, setPrikaziLozinku] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [ucitava, setUcitava] = useState(false);
  const [rezultat, setRezultat] = useState<RegistracijaOdgovor | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGreska(null);

    if (lozinka !== potvrdaLozinke) {
      setGreska('Lozinke se ne poklapaju.');
      return;
    }

    setUcitava(true);
    try {
      const odgovor = await api.post<RegistracijaOdgovor>('/korisnici/registracija-radnika', {
        ime,
        prezime,
        lozinka,
      });
      setRezultat(odgovor);
    } catch (err) {
      setGreska(err instanceof ApiGreska ? err.message : 'Greška pri povezivanju sa serverom.');
    } finally {
      setUcitava(false);
    }
  }

  if (rezultat) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center">
          <Logo size={40} wordmark className="mb-6 justify-center" />
          <div className="neu-icon-circle w-14 h-14 mx-auto mb-4 text-[var(--color-primary)]">
            <CheckCircle2 size={26} />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">Zahtev poslat</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Vaš nalog čeka odobrenje nadzornika ili administratora. Kada bude odobren, prijavite
            se sa email adresom ispod.
          </p>
          <div className="neu-inset rounded-2xl px-4 py-3 mb-6">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Vaš email za prijavu</p>
            <p className="font-semibold text-[var(--color-text)] break-all">{rezultat.email}</p>
          </div>
          <Link href="/login">
            <Button variant="primary" size="lg" className="w-full">
              Nazad na prijavu
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <Logo size={40} wordmark className="mb-6" />
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Registracija</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Nalog radnika — email se generiše automatski, a nalog čeka odobrenje pre prve prijave.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Ime"
            value={ime}
            onChange={(e) => setIme(e.target.value)}
            icon={<User size={18} />}
            required
            minLength={2}
            autoComplete="given-name"
          />
          <Input
            type="text"
            placeholder="Prezime"
            value={prezime}
            onChange={(e) => setPrezime(e.target.value)}
            icon={<User size={18} />}
            required
            minLength={2}
            autoComplete="family-name"
          />
          <Input
            type={prikaziLozinku ? 'text' : 'password'}
            placeholder="Lozinka"
            value={lozinka}
            onChange={(e) => setLozinka(e.target.value)}
            icon={<Lock size={18} />}
            required
            minLength={6}
            autoComplete="new-password"
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
          <Input
            type={prikaziLozinku ? 'text' : 'password'}
            placeholder="Potvrdite lozinku"
            value={potvrdaLozinke}
            onChange={(e) => setPotvrdaLozinke(e.target.value)}
            icon={<Lock size={18} />}
            required
            minLength={6}
            autoComplete="new-password"
          />

          {greska && (
            <div className="neu-inset rounded-2xl px-4 py-3 text-sm status-critical">{greska}</div>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={ucitava} className="mt-2">
            {ucitava ? 'Slanje…' : 'Registruj se'}
          </Button>

          <Link href="/login" className="text-center text-xs text-[var(--color-primary)] font-medium">
            Već imate nalog? Prijavite se
          </Link>
        </form>
      </Card>
    </div>
  );
}
