'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, ShieldCheck, User, Lock, CheckCircle2 } from 'lucide-react';
import { StatusNaloga } from '@shiftos/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { api, ApiGreska } from '@/lib/api';

interface NadzornikRed {
  id: string;
  email: string;
  status: StatusNaloga;
  createdAt: string;
}

export default function NadzorniciStranica() {
  const [nadzornici, setNadzornici] = useState<NadzornikRed[]>([]);
  const [greska, setGreska] = useState<string | null>(null);
  const [obrada, setObrada] = useState<string | null>(null);

  const [prikaziForm, setPrikaziForm] = useState(false);
  const [ime, setIme] = useState('');
  const [prezime, setPrezime] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [kreiranje, setKreiranje] = useState(false);
  const [greskaForm, setGreskaForm] = useState<string | null>(null);
  const [noviEmail, setNoviEmail] = useState<string | null>(null);

  function ucitaj() {
    api
      .get<NadzornikRed[]>('/korisnici/nadzornici')
      .then(setNadzornici)
      .catch((e) => setGreska(e instanceof ApiGreska ? e.message : 'Greška pri učitavanju.'));
  }

  useEffect(ucitaj, []);

  async function promeniStatus(n: NadzornikRed, aktivan: boolean) {
    setObrada(n.id);
    try {
      const akcija = aktivan ? 'aktiviraj' : 'deaktiviraj';
      const azuriran = await api.post<NadzornikRed>(`/korisnici/nadzornici/${n.id}/${akcija}`);
      setNadzornici((lista) => lista.map((x) => (x.id === n.id ? azuriran : x)));
    } catch (e) {
      setGreska(e instanceof ApiGreska ? e.message : 'Greška pri promeni statusa.');
    } finally {
      setObrada(null);
    }
  }

  async function kreirajNadzornika(e: FormEvent) {
    e.preventDefault();
    setGreskaForm(null);
    setKreiranje(true);
    try {
      const noviNadzornik = await api.post<NadzornikRed>('/korisnici/nadzornici', {
        ime,
        prezime,
        lozinka,
      });
      setNadzornici((lista) => [noviNadzornik, ...lista]);
      setNoviEmail(noviNadzornik.email);
      setIme('');
      setPrezime('');
      setLozinka('');
    } catch (e) {
      setGreskaForm(e instanceof ApiGreska ? e.message : 'Greška pri kreiranju naloga.');
    } finally {
      setKreiranje(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)] mb-1">Nadzornici</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Naloge nadzornika kreira i njima upravlja isključivo Administrator.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setPrikaziForm((v) => !v);
            setNoviEmail(null);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Novi nadzornik
        </Button>
      </div>

      {greska && (
        <div className="neu-inset rounded-2xl px-4 py-3 mb-6 text-sm status-critical">{greska}</div>
      )}

      {prikaziForm && (
        <Card className="mb-6 max-w-md">
          {noviEmail ? (
            <div className="text-center py-2">
              <CheckCircle2 size={26} className="mx-auto mb-3 text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-text-muted)] mb-2">Nalog kreiran — aktivan odmah.</p>
              <div className="neu-inset rounded-2xl px-4 py-3">
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Email za prijavu</p>
                <p className="font-semibold text-[var(--color-text)] break-all">{noviEmail}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={kreirajNadzornika} className="flex flex-col gap-3">
              <Input
                type="text"
                placeholder="Ime"
                value={ime}
                onChange={(e) => setIme(e.target.value)}
                icon={<User size={18} />}
                required
                minLength={2}
              />
              <Input
                type="text"
                placeholder="Prezime"
                value={prezime}
                onChange={(e) => setPrezime(e.target.value)}
                icon={<User size={18} />}
                required
                minLength={2}
              />
              <Input
                type="text"
                placeholder="Početna lozinka"
                value={lozinka}
                onChange={(e) => setLozinka(e.target.value)}
                icon={<Lock size={18} />}
                required
                minLength={6}
              />
              {greskaForm && <p className="text-sm status-critical">{greskaForm}</p>}
              <Button type="submit" variant="primary" disabled={kreiranje}>
                {kreiranje ? 'Kreiranje…' : 'Kreiraj nalog'}
              </Button>
            </form>
          )}
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {nadzornici.map((n) => (
          <Card key={n.id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="neu-icon-circle w-11 h-11 text-[var(--color-primary)] shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text)] truncate">{n.email}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {n.status === StatusNaloga.AKTIVAN ? 'Aktivan' : 'Deaktiviran'} · kreiran{' '}
                  {new Date(n.createdAt).toLocaleDateString('sr-RS')}
                </p>
              </div>
            </div>
            <Toggle
              checked={n.status === StatusNaloga.AKTIVAN}
              onChange={(aktivan) => promeniStatus(n, aktivan)}
              disabled={obrada === n.id}
              label={n.status === StatusNaloga.AKTIVAN ? 'Aktivan' : 'Deaktiviran'}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
