import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
  FAKTOR_USPESNOSTI,
  IshodZadatka,
  RazlogOdbijanja,
  TipDogadjaja,
  WelfordStatistika,
  oceniIzlazak,
} from '@shiftos/shared';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Brisanje postojećih podataka...');
  await prisma.terminal.deleteMany();
  await prisma.dogadjajLog.deleteMany();
  await prisma.zadatakDodela.deleteMany();
  await prisma.zadatak.deleteMany();
  await prisma.poseta.deleteMany();
  await prisma.sektorStatistika.deleteMany();
  await prisma.zadatakSablon.deleteMany();
  await prisma.korisnik.deleteMany();
  await prisma.radnikKvalifikacija.deleteMany();
  await prisma.radnik.deleteMany();
  await prisma.sektor.deleteMany();
  await prisma.kvalifikacija.deleteMany();

  console.log('Kreiranje kvalifikacija...');
  const [qc, viljuskar, hemikalije, pakovanje] = await Promise.all([
    prisma.kvalifikacija.create({ data: { naziv: 'Kontrola kvaliteta (QC)' } }),
    prisma.kvalifikacija.create({ data: { naziv: 'Rukovanje viljuškarom' } }),
    prisma.kvalifikacija.create({ data: { naziv: 'Rad sa hemikalijama' } }),
    prisma.kvalifikacija.create({ data: { naziv: 'Osnovna obuka pakovanja' } }),
  ]);

  console.log('Kreiranje sektora i njihovih zadataka...');
  const prijem = await prisma.sektor.create({
    data: {
      naziv: 'Prijem robe',
      potrebnaKvalifikacijaId: pakovanje.id,
      minimum: 2,
      kapacitet: 4,
      zadaciSabloni: {
        create: [
          { naziv: 'Istovar kamiona', ocekivanoTrajanje: 30 },
          { naziv: 'Evidentiranje pošiljke', ocekivanoTrajanje: 15 },
          { naziv: 'Provera propratne dokumentacije', ocekivanoTrajanje: 10 },
        ],
      },
    },
  });

  const skladiste = await prisma.sektor.create({
    data: {
      naziv: 'Skladištenje',
      potrebnaKvalifikacijaId: viljuskar.id,
      minimum: 2,
      kapacitet: 5,
      zadaciSabloni: {
        create: [
          { naziv: 'Smeštaj robe na paletni regal', ocekivanoTrajanje: 25 },
          { naziv: 'Popis stanja zaliha', ocekivanoTrajanje: 40 },
          { naziv: 'Premeštaj palete', ocekivanoTrajanje: 12 },
        ],
      },
    },
  });

  const pakovanjeSektor = await prisma.sektor.create({
    data: {
      naziv: 'Pakovanje',
      potrebnaKvalifikacijaId: pakovanje.id,
      minimum: 3,
      kapacitet: 6,
      zadaciSabloni: {
        create: [
          { naziv: 'Pakovanje porudžbine', ocekivanoTrajanje: 18 },
          { naziv: 'Etiketiranje paketa', ocekivanoTrajanje: 8 },
          { naziv: 'Kontrola kompletnosti porudžbine', ocekivanoTrajanje: 10 },
        ],
      },
    },
  });

  const kontrolaKvaliteta = await prisma.sektor.create({
    data: {
      naziv: 'Kontrola kvaliteta',
      potrebnaKvalifikacijaId: qc.id,
      minimum: 1,
      kapacitet: 2,
      zadaciSabloni: {
        create: [
          { naziv: 'Uzorkovanje serije', ocekivanoTrajanje: 20 },
          { naziv: 'Laboratorijska provera', ocekivanoTrajanje: 35 },
        ],
      },
    },
  });

  const utovar = await prisma.sektor.create({
    data: {
      naziv: 'Utovar',
      potrebnaKvalifikacijaId: viljuskar.id,
      minimum: 1,
      kapacitet: 3,
      zadaciSabloni: {
        create: [
          { naziv: 'Utovar kamiona', ocekivanoTrajanje: 28 },
          { naziv: 'Provera tovarnog lista', ocekivanoTrajanje: 9 },
        ],
      },
    },
  });

  await Promise.all(
    [prijem, skladiste, pakovanjeSektor, kontrolaKvaliteta, utovar].map((s) =>
      prisma.sektorStatistika.create({ data: { sektorId: s.id } }),
    ),
  );

  console.log('Kreiranje radnika...');
  const imena = [
    'Marko Marković',
    'Nikola Nikolić',
    'Ana Anić',
    'Jovana Jovanović',
    'Stefan Stefanović',
    'Milica Milić',
    'Petar Petrović',
    'Ivana Ivić',
    'Aleksandar Aleksić',
    'Tamara Tomić',
    'Nemanja Nešić',
    'Dragana Dragić',
  ];

  const radnici = [];
  for (const ime of imena) {
    radnici.push(await prisma.radnik.create({ data: { ime } }));
  }

  const raspodela: Record<number, string[]> = {
    0: [pakovanje.id],
    1: [pakovanje.id],
    2: [pakovanje.id, qc.id],
    3: [pakovanje.id],
    4: [viljuskar.id],
    5: [viljuskar.id],
    6: [viljuskar.id, pakovanje.id],
    7: [viljuskar.id],
    8: [qc.id],
    9: [qc.id, pakovanje.id],
    10: [hemikalije.id, viljuskar.id],
    11: [pakovanje.id, viljuskar.id],
  };

  for (const [indeks, kvalifikacijeIds] of Object.entries(raspodela)) {
    const radnik = radnici[Number(indeks)];
    for (const kvalifikacijaId of kvalifikacijeIds) {
      await prisma.radnikKvalifikacija.create({
        data: { radnikId: radnik.id, kvalifikacijaId },
      });
    }
  }

  console.log('Uparivanje demo NFC kartica...');

  await prisma.radnik.update({ where: { id: radnici[0].id }, data: { nfcTagId: 'DEMO-NFC-0001' } });
  await prisma.radnik.update({ where: { id: radnici[1].id }, data: { nfcTagId: 'DEMO-NFC-0002' } });

  console.log('Kreiranje demo dodele zadatka za danas...');
  const danas = new Date();
  danas.setUTCHours(0, 0, 0, 0);
  await prisma.zadatakDodela.create({
    data: {
      radnikId: radnici[0].id,
      sektorId: prijem.id,
      naziv: 'Prioritetna pošiljka — hitna isporuka',
      ocekivanoTrajanje: 25,
      datum: danas,
    },
  });

  console.log('Kreiranje test korisnika (RADNIK / NADZORNIK / ADMINISTRATOR)...');
  const lozinkaHash = await bcrypt.hash('sifra123', 10);

  await prisma.korisnik.create({
    data: {
      email: 'admin@shiftos.rs',
      lozinkaHash,
      uloga: 'ADMINISTRATOR',
      status: 'AKTIVAN',
    },
  });

  await prisma.korisnik.create({
    data: {
      email: 'nadzornik@shiftos.rs',
      lozinkaHash,
      uloga: 'NADZORNIK',
      status: 'AKTIVAN',
    },
  });

  await prisma.korisnik.create({
    data: {
      email: 'terminal@shiftos.rs',
      lozinkaHash,
      uloga: 'RADNIK',
      status: 'AKTIVAN',
    },
  });

  await prisma.korisnik.create({
    data: {
      email: 'nikola@shiftos.rs',
      lozinkaHash,
      uloga: 'RADNIK',
      status: 'AKTIVAN',
      radnikId: radnici[1].id,
    },
  });

  console.log('Kreiranje demo naloga na čekanju (samoregistracija)...');
  const bojan = await prisma.radnik.create({ data: { ime: 'Bojan Bojanić' } });
  await prisma.korisnik.create({
    data: {
      email: 'bojan.bojanic.a1c2e3@shiftos.rs',
      lozinkaHash,
      uloga: 'RADNIK',
      status: 'NA_CEKANJU',
      radnikId: bojan.id,
    },
  });

  console.log('Kreiranje 100 testnih radnika sa nalozima...');
  const testniNalozi = await kreirajTestneRadnike(lozinkaHash, [pakovanje, viljuskar, hemikalije, qc]);
  const izvestajPutanja = path.join(__dirname, 'test-radnici-nalozi.csv');
  fs.writeFileSync(
    izvestajPutanja,
    'ime,email,lozinka\n' + testniNalozi.map((n) => `${n.ime},${n.email},sifra123`).join('\n') + '\n',
  );

  console.log('Kreiranje istorije poseta za poslednjih 7 dana...');
  const istorija = await kreirajIstorijuPoseta(radnici[1].id, bojan.id);

  console.log('Seed završen.');
  console.log('');
  console.log('Test nalozi (lozinka za sve: "sifra123"):');
  console.log('  ADMINISTRATOR: admin@shiftos.rs');
  console.log('  NADZORNIK:     nadzornik@shiftos.rs');
  console.log('  RADNIK (TerminalShift kiosk): terminal@shiftos.rs');
  console.log('  RADNIK (lični profil):        nikola@shiftos.rs');
  console.log('  RADNIK (NA ČEKANJU, demo):    bojan.bojanic.a1c2e3@shiftos.rs');
  console.log(`  + 100 testnih radničkih naloga — puna lista: ${izvestajPutanja}`);
  console.log(
    `  Istorija: ${istorija.poseta} poseta, ${istorija.anomalija} anomalija, ${istorija.odbijanja} odbijenih ulazaka`,
  );
}

const MINUT = 60_000;

function slucajno(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function gaus(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function promesaj<T>(niz: T[]): T[] {
  const kopija = [...niz];
  for (let i = kopija.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopija[i], kopija[j]] = [kopija[j], kopija[i]];
  }
  return kopija;
}

async function upisiUDelovima<T>(redovi: T[], upis: (deo: T[]) => Promise<unknown>) {
  for (let i = 0; i < redovi.length; i += 1000) {
    await upis(redovi.slice(i, i + 1000));
  }
}

async function kreirajIstorijuPoseta(prioritetniRadnikId: string, iskljuceniRadnikId: string) {
  const sektori = await prisma.sektor.findMany({
    orderBy: { naziv: 'asc' },
    include: { zadaciSabloni: true },
  });
  const radnici = (await prisma.radnik.findMany({ include: { kvalifikacije: true } })).filter(
    (r) => r.id !== iskljuceniRadnikId,
  );
  const imaKvalifikaciju = (radnik: (typeof radnici)[number], kvalifikacijaId: string) =>
    radnik.kvalifikacije.some((k) => k.kvalifikacijaId === kvalifikacijaId);

  type PlaniranaPoseta = {
    id: string;
    radnikId: string;
    sektorId: string;
    vremeUlaska: Date;
    vremeIzlaska: Date;
    naziv: string;
    ocekivanoTrajanje: number;
  };
  const planirane: PlaniranaPoseta[] = [];
  const dogadjaji: {
    tip: string;
    vreme: Date;
    radnikId: string;
    sektorId: string;
    detalji: string;
  }[] = [];
  const sada = new Date();

  for (let pomak = 6; pomak >= 0; pomak--) {
    const dan = new Date(sada);
    dan.setHours(0, 0, 0, 0);
    dan.setDate(dan.getDate() - pomak);
    const vikend = dan.getDay() === 0 || dan.getDay() === 6;
    const pocetakSmene = new Date(dan).setHours(7, 0, 0, 0);
    const krajSmene = new Date(dan).setHours(vikend ? 11 : 15, 0, 0, 0);
    const granica = pomak === 0 ? Math.min(krajSmene, sada.getTime() - 5 * MINUT) : krajSmene;
    if (granica <= pocetakSmene + 30 * MINUT) continue;

    const zauzeti = new Set<string>();
    for (const sektor of sektori) {
      if (sektor.zadaciSabloni.length === 0) continue;
      const kandidati = promesaj(
        radnici.filter(
          (r) => !zauzeti.has(r.id) && imaKvalifikaciju(r, sektor.potrebnaKvalifikacijaId),
        ),
      );
      const indeksPrioritetnog = kandidati.findIndex((r) => r.id === prioritetniRadnikId);
      if (indeksPrioritetnog > 0) kandidati.unshift(...kandidati.splice(indeksPrioritetnog, 1));

      for (const radnik of kandidati.slice(0, vikend ? 1 : sektor.minimum + 1)) {
        zauzeti.add(radnik.id);
        let vreme = pocetakSmene + slucajno(0, 15) * MINUT;
        for (;;) {
          const sablon =
            sektor.zadaciSabloni[Math.floor(Math.random() * sektor.zadaciSabloni.length)];
          const trajanjeMin =
            Math.random() < 0.035
              ? sablon.ocekivanoTrajanje * slucajno(2.5, 3.5) + 25
              : Math.max(2, sablon.ocekivanoTrajanje * (1 + gaus() * 0.18));
          const izlazak = vreme + trajanjeMin * MINUT;
          if (izlazak > granica) break;
          planirane.push({
            id: crypto.randomUUID(),
            radnikId: radnik.id,
            sektorId: sektor.id,
            vremeUlaska: new Date(vreme),
            vremeIzlaska: new Date(izlazak),
            naziv: sablon.naziv,
            ocekivanoTrajanje: sablon.ocekivanoTrajanje,
          });
          vreme = izlazak + slucajno(1, 4) * MINUT;
        }
      }
    }

    const brojOdbijanja = vikend ? 1 : 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < brojOdbijanja; i++) {
      const sektor = sektori[Math.floor(Math.random() * sektori.length)];
      const nekvalifikovani = radnici.filter(
        (r) => !imaKvalifikaciju(r, sektor.potrebnaKvalifikacijaId),
      );
      if (nekvalifikovani.length === 0) continue;
      dogadjaji.push({
        tip: TipDogadjaja.ULAZAK_ODBIJEN,
        vreme: new Date(pocetakSmene + Math.random() * (granica - pocetakSmene)),
        radnikId: nekvalifikovani[Math.floor(Math.random() * nekvalifikovani.length)].id,
        sektorId: sektor.id,
        detalji: RazlogOdbijanja.NEDOSTAJE_KVALIFIKACIJA,
      });
    }
  }

  const posete = [];
  const zadaci = [];
  let brojAnomalija = 0;

  for (const sektor of sektori) {
    let statistika: WelfordStatistika = { brojUzoraka: 0, prosek: 0, m2: 0 };
    const sektorske = planirane
      .filter((p) => p.sektorId === sektor.id)
      .sort((a, b) => a.vremeIzlaska.getTime() - b.vremeIzlaska.getTime());

    for (const p of sektorske) {
      const trajanjeMin = (p.vremeIzlaska.getTime() - p.vremeUlaska.getTime()) / MINUT;
      const { rezultat, novaStatistika } = oceniIzlazak(trajanjeMin, statistika);
      statistika = novaStatistika;
      const anomalija = rezultat.ocenjeno && rezultat.anomalija;
      const zScore = rezultat.ocenjeno && Number.isFinite(rezultat.zScore) ? rezultat.zScore : null;
      const stvarnoTrajanje = Math.round(trajanjeMin);

      posete.push({
        id: p.id,
        radnikId: p.radnikId,
        sektorId: p.sektorId,
        vremeUlaska: p.vremeUlaska,
        vremeIzlaska: p.vremeIzlaska,
        anomalija,
        zScore,
        idempotencyKeyUlazak: `seed-ulazak-${p.id}`,
        idempotencyKeyIzlazak: `seed-izlazak-${p.id}`,
        createdAt: p.vremeUlaska,
      });
      zadaci.push({
        posetaId: p.id,
        naziv: p.naziv,
        ocekivanoTrajanje: p.ocekivanoTrajanje,
        stvarnoTrajanje,
        ishod:
          stvarnoTrajanje <= p.ocekivanoTrajanje * FAKTOR_USPESNOSTI
            ? IshodZadatka.USPESNO
            : IshodZadatka.NEUSPESNO,
      });
      dogadjaji.push(
        {
          tip: TipDogadjaja.ULAZAK_ODOBREN,
          vreme: p.vremeUlaska,
          radnikId: p.radnikId,
          sektorId: p.sektorId,
          detalji: p.naziv,
        },
        {
          tip: TipDogadjaja.IZLAZAK,
          vreme: p.vremeIzlaska,
          radnikId: p.radnikId,
          sektorId: p.sektorId,
          detalji: `${stvarnoTrajanje} min`,
        },
      );
      if (anomalija && zScore != null) {
        brojAnomalija++;
        dogadjaji.push({
          tip: TipDogadjaja.ANOMALIJA,
          vreme: p.vremeIzlaska,
          radnikId: p.radnikId,
          sektorId: p.sektorId,
          detalji: `z=${zScore.toFixed(2)}, ${stvarnoTrajanje} min`,
        });
      }
    }

    await prisma.sektorStatistika.update({ where: { sektorId: sektor.id }, data: statistika });
  }

  await upisiUDelovima(posete, (deo) => prisma.poseta.createMany({ data: deo }));
  await upisiUDelovima(zadaci, (deo) => prisma.zadatak.createMany({ data: deo }));
  await upisiUDelovima(dogadjaji, (deo) => prisma.dogadjajLog.createMany({ data: deo }));

  return {
    poseta: posete.length,
    anomalija: brojAnomalija,
    odbijanja: dogadjaji.filter((d) => d.tip === TipDogadjaja.ULAZAK_ODBIJEN).length,
  };
}

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

function generisiTestEmail(ime: string, prezime: string, indeks: number): string {
  const kratakId = indeks.toString(16).padStart(6, '0');
  return `${slug(ime)}.${slug(prezime)}.${kratakId}@shiftos.rs`;
}

async function kreirajTestneRadnike(lozinkaHash: string, kvalifikacije: { id: string }[]) {
  const imena = [
    'Marko', 'Nikola', 'Petar', 'Stefan', 'Aleksandar', 'Nemanja', 'Miloš', 'Uroš', 'Filip', 'Dušan',
    'Vladimir', 'Đorđe', 'Lazar', 'Bojan', 'Ivan', 'Nenad', 'Zoran', 'Goran', 'Dragan', 'Milan',
    'Ana', 'Jovana', 'Milica', 'Ivana', 'Tamara', 'Marija', 'Jelena', 'Sara', 'Teodora', 'Katarina',
    'Dragana', 'Snežana', 'Vesna', 'Marina', 'Nataša', 'Aleksandra', 'Milena', 'Bojana', 'Sandra', 'Danica',
  ];
  const prezimena = [
    'Marković', 'Nikolić', 'Petrović', 'Jovanović', 'Anić', 'Aleksić', 'Nešić', 'Milić', 'Ivić',
    'Tomić', 'Dragić', 'Stefanović', 'Popović', 'Đorđević', 'Simić', 'Pavlović', 'Kostić', 'Stanković',
    'Lazić', 'Ristić', 'Vasić', 'Milošević', 'Todorović', 'Radovanović', 'Obradović', 'Savić',
    'Đukić', 'Ilić', 'Krstić', 'Gajić',
  ];

  const testniNalozi: { ime: string; email: string }[] = [];
  const iskoriscenaImena = new Set<string>();

  for (let i = 0; i < 100; i++) {
    const ime = imena[Math.floor(Math.random() * imena.length)];
    let prezime = prezimena[Math.floor(Math.random() * prezimena.length)];
    let punoIme = `${ime} ${prezime}`;
    while (iskoriscenaImena.has(punoIme)) {
      prezime = prezimena[Math.floor(Math.random() * prezimena.length)];
      punoIme = `${ime} ${prezime}`;
    }
    iskoriscenaImena.add(punoIme);

    const radnik = await prisma.radnik.create({ data: { ime: punoIme } });

    const brojKvalifikacija = 1 + Math.floor(Math.random() * 2);
    const izabraneKvalifikacije = [...kvalifikacije]
      .sort(() => Math.random() - 0.5)
      .slice(0, brojKvalifikacija);
    for (const k of izabraneKvalifikacije) {
      await prisma.radnikKvalifikacija.create({
        data: { radnikId: radnik.id, kvalifikacijaId: k.id },
      });
    }

    const email = generisiTestEmail(ime, prezime, i);
    await prisma.korisnik.create({
      data: { email, lozinkaHash, uloga: 'RADNIK', status: 'AKTIVAN', radnikId: radnik.id },
    });

    testniNalozi.push({ ime: punoIme, email });
  }

  return testniNalozi;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
