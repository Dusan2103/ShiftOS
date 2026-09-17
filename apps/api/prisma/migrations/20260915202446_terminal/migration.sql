-- CreateTable
CREATE TABLE "Terminal" (
    "id" TEXT NOT NULL,
    "naziv" TEXT,
    "sektorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "azuriranAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Terminal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Terminal" ADD CONSTRAINT "Terminal_sektorId_fkey" FOREIGN KEY ("sektorId") REFERENCES "Sektor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

