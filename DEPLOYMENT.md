# ShiftOS — puštanje online

Ceo ShiftOS (veb aplikacija **i** API) ide na Netlify kao jedan projekat.
Jedina stvar koja ne može da živi na Netlify-u je sama PostgreSQL baza — nju
uzimaš besplatno na Neon-u i samo kopiraš jedan link.

Dakle: **dva naloga ukupno** (Netlify + Neon), i jedna promenljiva okruženja.

---

## Korak 1 — Baza (Neon, besplatno)

1. Otvori nalog na https://neon.tech i napravi novi projekat.
2. Kopiraj **Pooled connection string** (Neon ga nudi u "Connection Details",
   obavezno verziju sa `-pooler` u adresi).

   > Pooled verzija je bitna: API radi kao serverless funkcija, pa se
   > konekcije otvaraju i zatvaraju često — bez pooler-a bi Neon brzo dostigao
   > limit broja konekcija.

3. Sačuvaj taj string, treba ti u koraku 2.

## Korak 2 — Aplikacija (Netlify)

1. Otvori nalog na https://netlify.com.
2. "Add new site" → "Import an existing project" → poveži GitHub repo sa
   ShiftOS-om (ili prevuci ceo folder projekta u Netlify "Deploy manually").
3. Netlify automatski čita `netlify.toml` iz korena — build komanda, funkcije
   i preusmeravanja su već podešeni, ništa ne diraš.
4. Idi na **Site settings → Environment variables** i dodaj dve promenljive:

   | Naziv | Vrednost |
   |---|---|
   | `DATABASE_URL` | pooled connection string iz koraka 1 |
   | `JWT_SECRET` | dugačak nasumičan string (`openssl rand -hex 32`) |

   > `JWT_SECRET` je obavezan — server namerno odbija da se pokrene u
   > produkciji bez njega, da ne bi radio sa poznatom razvojnom lozinkom.

   > **Pažnja na "Scopes":** Netlify dozvoljava da promenljivu ograničiš na
   > samo neke faze (Builds / Functions / Runtime / Post processing).
   > `DATABASE_URL` mora biti vidljiv i tokom **Builds** faze (tu se pokreće
   > `prisma migrate deploy`), ne samo u Functions. Ako nisi siguran, ostavi
   > sve scope-ove čekirane — to je podrazumevano.

5. Pokreni deploy. Netlify će tokom build-a automatski primeniti sve migracije
   na Neon bazu (`prisma migrate deploy` je deo build komande), tako da baza
   dobija svoju strukturu bez ijedne ručne komande.

Posle deploy-a dobijaš adresu oblika `https://<naziv>.netlify.app`:

- veb aplikacija (Admin/Nadzornik) je na toj adresi,
- API je na `https://<naziv>.netlify.app/api` (ista adresa, `/api` prefiks).

Pošto su na istom domenu, nema CORS podešavanja niti dodatnih promenljivih.

## Korak 3 — Prvi Administrator nalog

Baza je posle koraka 2 prazna (samo struktura). Administrator se ne može
samoregistrovati — to je namerno. Napravi ga jednom, lokalno:

```bash
cd apps/api
DATABASE_URL="<pooled connection string>" npx prisma studio
```

U Prisma Studio-u otvori tabelu `Korisnik` i dodaj red:

| Polje | Vrednost |
|---|---|
| `email` | tvoj admin email |
| `lozinkaHash` | heš lozinke (vidi komandu ispod) |
| `uloga` | `ADMINISTRATOR` |
| `status` | `AKTIVAN` |

Heš lozinke:

```bash
cd apps/api
node -e "console.log(require('bcrypt').hashSync('TVOJA_LOZINKA', 10))"
```

## Korak 4 (opciono) — Demo podaci

Ako želiš pun demo sadržaj (5 sektora, kvalifikacije, 100 testnih radnika sa
nalozima i 7 dana istorije poseta):

```bash
cd apps/api
DATABASE_URL="<pooled connection string>" npm run seed
```

> **Pažnja:** seed skripta prvo **briše sve** iz baze, pa je ubacuje ispočetka.
> Pokreni je samo na demo bazi, nikada nad bazom sa stvarnim podacima pogona.

Lista generisanih naloga završi u `apps/api/prisma/test-radnici-nalozi.csv`
(lozinka za sve testne naloge: `sifra123`).

## Korak 5 — Android aplikacije (ShiftOS i TerminalShift)

Kada znaš svoju Netlify adresu:

1. U `apps/web/package.json`, u skripti `build:android`, zameni
   `NEXT_PUBLIC_API_URL=http://localhost:3001` sa
   `NEXT_PUBLIC_API_URL=https://<naziv>.netlify.app/api`.
2. U `android/app/src/main/java/com/shiftos/terminal/MainActivity.kt` vrati
   `postavke.mixedContentMode` na `MIXED_CONTENT_NEVER_ALLOW` (API je sada
   HTTPS, pa popuštanje više nije potrebno).
3. Izgradi i instaliraj:

```bash
cd apps/web && npm run sync:android
cd ../android && ./gradlew assembleDebug
```

APK fajlovi:
- `android/app/build/outputs/apk/shiftos/debug/app-shiftos-debug.apk`
- `android/app/build/outputs/apk/terminalshift/debug/app-terminalshift-debug.apk`

---

## Šta gde radi

| Deo | Gde živi | Kako se pušta |
|---|---|---|
| Veb aplikacija (Admin, Nadzornik) | Netlify | automatski, iz `netlify.toml` |
| REST API (NestJS) | Netlify Functions (`/api`) | automatski, iz `netlify.toml` |
| Baza (PostgreSQL) | Neon | `DATABASE_URL` promenljiva |
| Migracije baze | Netlify build | automatski pri svakom deploy-u |
| ShiftOS / TerminalShift (Android) | APK na uređaju | `gradlew assembleDebug` |
