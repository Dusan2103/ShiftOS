import { SetMetadata } from '@nestjs/common';
import { Uloga } from '@shiftos/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Uloga[]) => SetMetadata(ROLES_KEY, roles);
