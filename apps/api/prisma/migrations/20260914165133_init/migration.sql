-- CreateTable
CREATE TABLE "Kvalifikacija" (
    "id" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kvalifikacija_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sektor" (
    "id" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "potrebnaKvalifikacijaId" TEXT NOT NULL,
    "minimum" INTEGER NOT NULL,
    "kapacitet" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sektor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZadatakSablon" (
    "id" TEXT NOT NULL,
    "sektorId" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "ocekivanoTrajanje" INTEGER NOT NULL,

    CONSTRAINT "ZadatakSablon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SektorStatistika" (
    "id" TEXT NOT NULL,
    "sektorId" TEXT NOT NULL,
    "brojUzoraka" INTEGER NOT NULL DEFAULT 0,
    "prosek" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "m2" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SektorStatistika_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Radnik" (
    "id" TEXT NOT NULL,
    "ime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Radnik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadnikKvalifikacija" (
    "radnikId" TEXT NOT NULL,
    "kvalifikacijaId" TEXT NOT NULL,

    CONSTRAINT "RadnikKvalifikacija_pkey" PRIMARY KEY ("radnikId","kvalifikacijaId")
);

-- CreateTable
CREATE TABLE "Poseta" (
    "id" TEXT NOT NULL,
    "radnikId" TEXT NOT NULL,
    "sektorId" TEXT NOT NULL,
    "vremeUlaska" TIMESTAMP(3) NOT NULL,
    "vremeIzlaska" TIMESTAMP(3),
    "anomalija" BOOLEAN NOT NULL DEFAULT false,
    "zScore" DOUBLE PRECISION,
    "idempotencyKeyUlazak" TEXT NOT NULL,
    "idempotencyKeyIzlazak" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poseta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zadatak" (
    "id" TEXT NOT NULL,
    "posetaId" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "ocekivanoTrajanje" INTEGER NOT NULL,
    "stvarnoTrajanje" INTEGER,
    "ishod" TEXT,

    CONSTRAINT "Zadatak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Korisnik" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lozinkaHash" TEXT NOT NULL,
    "uloga" TEXT NOT NULL,
    "radnikId" TEXT,

    CONSTRAINT "Korisnik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DogadjajLog" (
    "id" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "vreme" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "radnikId" TEXT,
    "sektorId" TEXT,
    "detalji" TEXT,

    CONSTRAINT "DogadjajLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kvalifikacija_naziv_key" ON "Kvalifikacija"("naziv");

-- CreateIndex
CREATE UNIQUE INDEX "Sektor_naziv_key" ON "Sektor"("naziv");

-- CreateIndex
CREATE UNIQUE INDEX "SektorStatistika_sektorId_key" ON "SektorStatistika"("sektorId");

-- CreateIndex
CREATE UNIQUE INDEX "Poseta_idempotencyKeyUlazak_key" ON "Poseta"("idempotencyKeyUlazak");

-- CreateIndex
CREATE UNIQUE INDEX "Poseta_idempotencyKeyIzlazak_key" ON "Poseta"("idempotencyKeyIzlazak");

-- CreateIndex
CREATE INDEX "Poseta_sektorId_vremeIzlaska_idx" ON "Poseta"("sektorId", "vremeIzlaska");

-- CreateIndex
CREATE INDEX "Poseta_radnikId_idx" ON "Poseta"("radnikId");

-- CreateIndex
CREATE UNIQUE INDEX "Zadatak_posetaId_key" ON "Zadatak"("posetaId");

-- CreateIndex
CREATE UNIQUE INDEX "Korisnik_email_key" ON "Korisnik"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Korisnik_radnikId_key" ON "Korisnik"("radnikId");

-- CreateIndex
CREATE INDEX "DogadjajLog_vreme_idx" ON "DogadjajLog"("vreme");

-- AddForeignKey
ALTER TABLE "Sektor" ADD CONSTRAINT "Sektor_potrebnaKvalifikacijaId_fkey" FOREIGN KEY ("potrebnaKvalifikacijaId") REFERENCES "Kvalifikacija"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadatakSablon" ADD CONSTRAINT "ZadatakSablon_sektorId_fkey" FOREIGN KEY ("sektorId") REFERENCES "Sektor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SektorStatistika" ADD CONSTRAINT "SektorStatistika_sektorId_fkey" FOREIGN KEY ("sektorId") REFERENCES "Sektor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadnikKvalifikacija" ADD CONSTRAINT "RadnikKvalifikacija_radnikId_fkey" FOREIGN KEY ("radnikId") REFERENCES "Radnik"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadnikKvalifikacija" ADD CONSTRAINT "RadnikKvalifikacija_kvalifikacijaId_fkey" FOREIGN KEY ("kvalifikacijaId") REFERENCES "Kvalifikacija"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poseta" ADD CONSTRAINT "Poseta_radnikId_fkey" FOREIGN KEY ("radnikId") REFERENCES "Radnik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poseta" ADD CONSTRAINT "Poseta_sektorId_fkey" FOREIGN KEY ("sektorId") REFERENCES "Sektor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zadatak" ADD CONSTRAINT "Zadatak_posetaId_fkey" FOREIGN KEY ("posetaId") REFERENCES "Poseta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Korisnik" ADD CONSTRAINT "Korisnik_radnikId_fkey" FOREIGN KEY ("radnikId") REFERENCES "Radnik"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DogadjajLog" ADD CONSTRAINT "DogadjajLog_radnikId_fkey" FOREIGN KEY ("radnikId") REFERENCES "Radnik"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DogadjajLog" ADD CONSTRAINT "DogadjajLog_sektorId_fkey" FOREIGN KEY ("sektorId") REFERENCES "Sektor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
