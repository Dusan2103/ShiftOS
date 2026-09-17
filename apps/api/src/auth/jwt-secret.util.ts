const DEV_SECRET = 'shiftos-dev-secret-change-me';

export function preuzmiJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET nije postavljen u produkciji — server se namerno ne pokreće. ' +
        'Postavi ga (npr. `openssl rand -hex 32`) pre pokretanja. Vidi DEPLOYMENT.md.',
    );
  }

  return DEV_SECRET;
}
