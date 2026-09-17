import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KreirajKvalifikacijuDto, IzmeniKvalifikacijuDto } from './dto/kvalifikacija.dto';

@Injectable()
export class KvalifikacijaService {
  constructor(private readonly prisma: PrismaService) {}

  najdiSve() {
    return this.prisma.kvalifikacija.findMany({ orderBy: { naziv: 'asc' } });
  }

  kreiraj(dto: KreirajKvalifikacijuDto) {
    return this.prisma.kvalifikacija.create({ data: dto });
  }

  izmeni(id: string, dto: IzmeniKvalifikacijuDto) {
    return this.prisma.kvalifikacija.update({ where: { id }, data: dto });
  }

  obrisi(id: string) {
    return this.prisma.kvalifikacija.delete({ where: { id } });
  }
}
