import { IsString, MinLength } from 'class-validator';

export class KreirajKvalifikacijuDto {
  @IsString()
  @MinLength(2)
  naziv!: string;
}

export class IzmeniKvalifikacijuDto extends KreirajKvalifikacijuDto {}
