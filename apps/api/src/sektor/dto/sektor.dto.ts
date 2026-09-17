import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class KreirajSektorDto {
  @IsString()
  @MinLength(2)
  naziv!: string;

  @IsString()
  potrebnaKvalifikacijaId!: string;

  @IsInt()
  @Min(0)
  minimum!: number;

  @IsInt()
  @Min(1)
  kapacitet!: number;
}

export class IzmeniSektorDto extends KreirajSektorDto {}

export class KreirajZadatakSablonDto {
  @IsString()
  @MinLength(2)
  naziv!: string;

  @IsInt()
  @Min(1)
  ocekivanoTrajanje!: number;
}
