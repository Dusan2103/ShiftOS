import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class UlazakDto {
  @IsString()
  idempotencyKey!: string;

  @IsString()
  radnikId!: string;

  @IsString()
  sektorId!: string;

  @IsOptional()
  @IsISO8601()
  vremeUlaska?: string;
}

export class IzlazakDto {
  @IsString()
  idempotencyKey!: string;

  @IsString()
  posetaId!: string;

  @IsOptional()
  @IsISO8601()
  vremeIzlaska?: string;
}
