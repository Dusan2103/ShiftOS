import { Uloga } from '@shiftos/shared';

export interface JwtPayload {
  sub: string;
  email: string;
  uloga: Uloga;
  radnikId: string | null;
}
