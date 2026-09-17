import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrujTerminalDto, IzmeniTerminalDto } from './dto/terminal.dto';

const SA_SEKTOROM = { include: { sektor: true } };

function terminalNijePronadjen(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    throw new NotFoundException('Terminal nije pronađen');
  }
  throw err;
}

@Injectable()
export class TerminalService {
  constructor(private readonly prisma: PrismaService) {}

  registruj(dto: RegistrujTerminalDto) {
    return this.prisma.terminal.create({
      data: { sektorId: dto.sektorId, naziv: dto.naziv },
      ...SA_SEKTOROM,
    });
  }

  najdiSve() {
    return this.prisma.terminal.findMany({ ...SA_SEKTOROM, orderBy: { createdAt: 'desc' } });
  }

  async najdiJedan(id: string) {
    const terminal = await this.prisma.terminal.findUnique({ where: { id }, ...SA_SEKTOROM });
    if (!terminal) throw new NotFoundException('Terminal nije pronađen');
    return terminal;
  }

  izmeni(id: string, dto: IzmeniTerminalDto) {
    return this.prisma.terminal
      .update({
        where: { id },
        data: { sektorId: dto.sektorId, naziv: dto.naziv },
        ...SA_SEKTOROM,
      })
      .catch(terminalNijePronadjen);
  }

  obrisi(id: string) {
    return this.prisma.terminal.delete({ where: { id } }).catch(terminalNijePronadjen);
  }
}
