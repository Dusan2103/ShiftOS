# ShiftOS

Sistem za kontrolu pristupa sektorima i detekciju anomalija u proizvodnom
pogonu — praktični deo diplomskog rada *"ShiftOS: Kontrola pristupa i
detekcija anomalija u pogonu"* (Univerzitet Singidunum, Tehnički fakultet).

## Šta sistem radi

Radnik prilazi kontrolnim vratima sektora i svojim telefonom očitava QR kod
ili NFC oznaku terminala. Sistem u tom trenutku proverava dva tvrda pravila —
da li radnik poseduje kvalifikaciju koju sektor zahteva i da li je sektor
popunjen do kapaciteta — i, ako su oba zadovoljena, otvara posetu i dodeljuje
zadatak. Pri izlasku sistem računa trajanje boravka i statistički procenjuje
da li je ono neuobičajeno za taj sektor.

Kontrola pristupa radi i bez mrežne veze: terminal donosi odluku lokalno, nad
keširanim podacima, a zapise šalje serveru naknadno, idempotentno.

## Celine sistema

```
/apps
  /web      Next.js — veb aplikacija (administrator, nadzornik) i
            korisnički sloj obe Android aplikacije
  /api      NestJS + Prisma + PostgreSQL REST API
/packages
  /shared   Deljeni tipovi i ČISTI ALGORITMI (kontrola pristupa, detekcija
            anomalija) — isti kod koristi server i terminal
/android    Nativna Android ljuska, dva izdanja iz istog koda:
            ShiftOS (radnici i nadzornici) i TerminalShift (kiosk na vratima)
/netlify    Serverless funkcija koja isporučuje API zajedno sa veb aplikacijom
```

Frontend: Next.js 16, React 19, Tailwind CSS v4, Zustand, Dexie.js (IndexedDB),
Recharts. Backend: NestJS 12, Prisma 7, Passport JWT. Android: Kotlin ljuska sa
ugrađenim veb sadržajem, NFC čitanje i emitovanje (Host Card Emulation).

## Centralni algoritamski doprinos

Oba algoritma žive u `packages/shared/src/algoritmi/` kao čiste, testirane
funkcije bez zavisnosti od baze ili mreže:

- `kontrolaPristupa.ts` — deterministička provera kvalifikacije i kapaciteta
- `welford.ts` + `detekcijaAnomalija.ts` — inkrementalna Welford-statistika i
  z-vrednost za detekciju anomalnog trajanja boravka

Zato što su u deljenom paketu, isti kod se izvršava:

1. **autoritativno na serveru** (`apps/api/src/poseta/poseta.service.ts`),
   unutar Prisma transakcije sa `SELECT ... FOR UPDATE` nad redom sektora, da
   paralelni ulasci ne prekorače kapacitet;
2. **lokalno na terminalu, i bez interneta**
   (`apps/web/src/lib/offline-kontrola.ts`), nad podacima keširanim u Dexie
   bazi uređaja.

## Pokretanje za razvoj

```bash
docker compose up -d          # PostgreSQL
npm install
npm run build:shared
npm run db:migrate            # migracije
npm run db:seed               # demo podaci, 100 testnih radnika i 7 dana istorije poseta

npm run dev:api               # API na :3001
npm run dev:web               # veb na :3000
```

Test nalozi (lozinka za sve: `sifra123`):

| Uloga | Email |
|---|---|
| Administrator | `admin@shiftos.rs` |
| Nadzornik | `nadzornik@shiftos.rs` |
| Terminal (kiosk) | `terminal@shiftos.rs` |
| Radnik | `nikola@shiftos.rs` |

Generisanih 100 testnih radničkih naloga nalazi se u
`apps/api/prisma/test-radnici-nalozi.csv`.

## Android aplikacije

```bash
cd apps/web && npm run sync:android
cd ../../android && ./gradlew assembleDebug
```

Rezultat su dva APK fajla:

- `app/build/outputs/apk/shiftos/debug/app-shiftos-debug.apk` — za radnike i nadzornike
- `app/build/outputs/apk/terminalshift/debug/app-terminalshift-debug.apk` — za uređaje na vratima sektora

## Testiranje

```bash
npm test                # 22 jedinična testa (algoritmi, statistika, pokrivenost)
npm run test:e2e        # 5 integracionih testova nad bazom (idempotentnost, kapacitet)
npm run test:integracija  # 31 test nad pokrenutim API-jem (terminal, sinhronizacija, sesija, vlasništvo) — zahteva da API radi na localhost:3001
npm run experiments     # eksperimenti H1 i H2 iz diplomskog rada
```
