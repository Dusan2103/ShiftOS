import { IsDateString, IsInt, IsString, Min, MinLength } from 'class-validator';

export class KreirajDodeluDto {
  @IsString()
  radnikId!: string;

  @IsString()
  sektorId!: string;

  @IsString()
  @MinLength(2)
  naziv!: string;

  @IsInt()
  @Min(1)
  ocekivanoTrajanje!: number;

  @IsDateString()
  datum!: string;
}
