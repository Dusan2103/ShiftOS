import { IsString, MinLength } from 'class-validator';

export class RegistracijaRadnikaDto {
  @IsString()
  @MinLength(2)
  ime!: string;

  @IsString()
  @MinLength(2)
  prezime!: string;

  @IsString()
  @MinLength(6)
  lozinka!: string;
}

export class KreirajNadzornikaDto extends RegistracijaRadnikaDto {}
