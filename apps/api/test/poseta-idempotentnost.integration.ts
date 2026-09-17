import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaService } from '../src/prisma/prisma.service';
import { PosetaService } from '../src/poseta/poseta.service';
import { RazlogOdbijanja } from '@shiftos/shared';

let prosli = 0;
let pali = 0;

async function test(naziv: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    prosli++;
    console.log(`  ✓ ${naziv}`);
  } catch (err) {
    pali++;
    console.error(`  ✗ ${naziv}`);
    console.error(`    ${err instanceof Error ? err.message : err}`);
  }
}

async function main() {
  const prisma = new PrismaService();
  const posetaService = new PosetaService(prisma);
  await prisma.$connect();

  console.log('PosetaService — idempotentnost i transakciona bezbednost (integracioni test)\n');

  async function saTestnimSektorom<T>(
    kapacitet: number,
    brojRadnika: number,
    fn: (ctx: { sektorId: string; radnikIds: string[] }) => Promise<T>,
  ): Promise<T> {
    const kvalifikacija = await prisma.kvalifikacija.create({
      data: { naziv: `test-kval-${Date.now()}-${Math.random()}` },
    });
    const sektor = await prisma.sektor.create({
      data: {
        naziv: `test-sektor-${Date.now()}-${Math.random()}`,
        potrebnaKvalifikacijaId: kvalifikacija.id,
        minimum: 1,
        kapacitet,
      },
    });
    await prisma.sektorStatistika.create({ data: { sektorId: sektor.id } });

    const radnikIds: string[] = [];
    for (let i = 0; i < brojRadnika; i++) {
      const radnik = await prisma.radnik.create({
        data: { ime: `Test Radnik ${i}-${Date.now()}-${Math.random()}` },
      });
      await prisma.radnikKvalifikacija.create({
        data: { radnikId: radnik.id, kvalifikacijaId: kvalifikacija.id },
      });
      radnikIds.push(radnik.id);
    }

    try {
      return await fn({ sektorId: sektor.id, radnikIds });
    } finally {
      await prisma.dogadjajLog.deleteMany({ where: { sektorId: sektor.id } });
      await prisma.zadatak.deleteMany({ where: { poseta: { sektorId: sektor.id } } });
      await prisma.poseta.deleteMany({ where: { sektorId: sektor.id } });
      await prisma.sektorStatistika.deleteMany({ where: { sektorId: sektor.id } });
      await prisma.radnikKvalifikacija.deleteMany({ where: { kvalifikacijaId: kvalifikacija.id } });
      await prisma.radnik.deleteMany({ where: { id: { in: radnikIds } } });
      await prisma.sektor.delete({ where: { id: sektor.id } });
      await prisma.kvalifikacija.delete({ where: { id: kvalifikacija.id } });
    }
  }

  await test('ponovljen zahtev sa istim idempotencyKey ne kreira duplikat posete', async () => {
    await saTestnimSektorom(1, 1, async ({ sektorId, radnikIds }) => {
      const idempotencyKey = `test-ulazak-${Date.now()}`;
      const dto = { idempotencyKey, radnikId: radnikIds[0], sektorId };

      const prvi = await posetaService.pokusajUlaskaRadnika(dto);
      const drugi = await posetaService.pokusajUlaskaRadnika(dto);

      assert.equal(prvi.odobreno, true);
      assert.equal(drugi.odobreno, true);
      if (prvi.odobreno && drugi.odobreno) {
        assert.equal(drugi.poseta.id, prvi.poseta.id);
      }

      const brojZapisa = await prisma.poseta.count({
        where: { idempotencyKeyUlazak: idempotencyKey },
      });
      assert.equal(brojZapisa, 1);
    });
  });

  await test('paralelni zahtevi sa istim idempotencyKey (trka) ne prave duplikat', async () => {
    await saTestnimSektorom(1, 1, async ({ sektorId, radnikIds }) => {
      const idempotencyKey = `test-trka-${Date.now()}`;
      const dto = { idempotencyKey, radnikId: radnikIds[0], sektorId };

      const [a, b] = await Promise.all([
        posetaService.pokusajUlaskaRadnika(dto),
        posetaService.pokusajUlaskaRadnika(dto),
      ]);

      assert.equal(a.odobreno, true);
      assert.equal(b.odobreno, true);
      if (a.odobreno && b.odobreno) {
        assert.equal(a.poseta.id, b.poseta.id);
      }

      const brojZapisa = await prisma.poseta.count({
        where: { idempotencyKeyUlazak: idempotencyKey },
      });
      assert.equal(brojZapisa, 1);
    });
  });

  await test('paralelni ulasci različitih radnika ne prekoračuju kapacitet sektora (kapacitet=1)', async () => {
    await saTestnimSektorom(1, 5, async ({ sektorId, radnikIds }) => {
      const rezultati = await Promise.all(
        radnikIds.map((radnikId, i) =>
          posetaService.pokusajUlaskaRadnika({
            idempotencyKey: `test-kapacitet-${Date.now()}-${i}`,
            radnikId,
            sektorId,
          }),
        ),
      );

      const odobreni = rezultati.filter((r) => r.odobreno);
      const odbijeni = rezultati.filter((r) => !r.odobreno);

      assert.equal(odobreni.length, 1);
      assert.equal(odbijeni.length, radnikIds.length - 1);
      for (const r of odbijeni) {
        if (!r.odobreno) {
          assert.equal(r.razlog, RazlogOdbijanja.KAPACITET_POPUNJEN);
        }
      }

      const brojUSektoru = await prisma.poseta.count({
        where: { sektorId, vremeIzlaska: null },
      });
      assert.equal(brojUSektoru, 1);
    });
  });

  await test('ponovljen zahtev za izlazak ne ažurira statistiku sektora dva puta', async () => {
    await saTestnimSektorom(1, 1, async ({ sektorId, radnikIds }) => {
      const ulazakKey = `test-izlazak-ulazak-${Date.now()}`;
      const ulazak = await posetaService.pokusajUlaskaRadnika({
        idempotencyKey: ulazakKey,
        radnikId: radnikIds[0],
        sektorId,
      });
      assert.equal(ulazak.odobreno, true);
      if (!ulazak.odobreno) return;

      const izlazakKey = `test-izlazak-izlazak-${Date.now()}`;
      const izlazakDto = { idempotencyKey: izlazakKey, posetaId: ulazak.poseta.id };

      await posetaService.izlazakRadnika(izlazakDto);
      await posetaService.izlazakRadnika(izlazakDto);

      const statistika = await prisma.sektorStatistika.findUnique({ where: { sektorId } });
      assert.equal(statistika?.brojUzoraka, 1);
    });
  });

  await test('paralelni zahtevi za isti izlazak (trka) ne ažuriraju statistiku sektora dva puta', async () => {
    await saTestnimSektorom(1, 1, async ({ sektorId, radnikIds }) => {
      const ulazak = await posetaService.pokusajUlaskaRadnika({
        idempotencyKey: `test-izlazak-trka-ulazak-${Date.now()}`,
        radnikId: radnikIds[0],
        sektorId,
      });
      assert.equal(ulazak.odobreno, true);
      if (!ulazak.odobreno) return;

      const izlazakKey = `test-izlazak-trka-izlazak-${Date.now()}`;
      const izlazakDto = { idempotencyKey: izlazakKey, posetaId: ulazak.poseta.id };

      await Promise.all([
        posetaService.izlazakRadnika(izlazakDto),
        posetaService.izlazakRadnika(izlazakDto),
      ]);

      const statistika = await prisma.sektorStatistika.findUnique({ where: { sektorId } });
      assert.equal(statistika?.brojUzoraka, 1);
    });
  });

  await prisma.$disconnect();

  console.log(`\n${prosli} prošlo, ${pali} palo.`);
  if (pali > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Neočekivana greška u integracionom testu:', err);
  process.exit(1);
});
