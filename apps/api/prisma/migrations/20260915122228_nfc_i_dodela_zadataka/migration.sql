-- AlterTable
ALTER TABLE "Radnik" ADD COLUMN     "nfcTagId" TEXT;

-- CreateTable
CREATE TABLE "ZadatakDodela" (
    "id" TEXT NOT NULL,
    "radnikId" TEXT NOT NULL,
    "sektorId" TEXT NOT NULL,
    "naziv" TEXT NOT NULL,
    "ocekivanoTrajanje" INTEGER NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "izvrseno" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZadatakDodela_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ZadatakDodela_radnikId_datum_idx" ON "ZadatakDodela"("radnikId", "datum");

-- CreateIndex
CREATE INDEX "ZadatakDodela_sektorId_datum_idx" ON "ZadatakDodela"("sektorId", "datum");

-- CreateIndex
CREATE UNIQUE INDEX "Radnik_nfcTagId_key" ON "Radnik"("nfcTagId");

-- AddForeignKey
ALTER TABLE "ZadatakDodela" ADD CONSTRAINT "ZadatakDodela_radnikId_fkey" FOREIGN KEY ("radnikId") REFERENCES "Radnik"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZadatakDodela" ADD CONSTRAINT "ZadatakDodela_sektorId_fkey" FOREIGN KEY ("sektorId") REFERENCES "Sektor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

