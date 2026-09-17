import { cp, rm, existsSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cpAsync = promisify(cp);
const rmAsync = promisify(rm);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const izvor = path.resolve(__dirname, '../out');
const cilj = path.resolve(__dirname, '../../../android/app/src/main/assets/www');

async function main() {
  if (!existsSync(izvor)) {
    console.error(`Nema statičnog exporta na ${izvor} — prvo pokreni "npm run build:android".`);
    process.exit(1);
  }

  console.log(`Brišem stari sadržaj: ${cilj}`);
  await rmAsync(cilj, { recursive: true, force: true });

  console.log(`Kopiram ${izvor} -> ${cilj}`);
  await cpAsync(izvor, cilj, { recursive: true });

  console.log('Gotovo. Sledeći korak: build Android APK-a (android/gradlew assembleDebug).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
