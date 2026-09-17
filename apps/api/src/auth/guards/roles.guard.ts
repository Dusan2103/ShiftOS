import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Uloga } from '@shiftos/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const zahtevaneUloge = this.reflector.getAllAndOverride<Uloga[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!zahtevaneUloge || zahtevaneUloge.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const korisnik = request.user as JwtPayload | undefined;
    if (!korisnik || !zahtevaneUloge.includes(korisnik.uloga)) {
      throw new ForbiddenException('Nemate ovlašćenje za ovu akciju');
    }
    return true;
  }
}
