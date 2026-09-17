import { IsString, MinLength } from 'class-validator';

export class KreirajRadnikaDto {
  @IsString()
  @MinLength(2)
  ime!: string;
}

export class IzmeniRadnikaDto extends KreirajRadnikaDto {}

export class PostaviNfcTagDto {
  @IsString()
  @MinLength(4)
  nfcTagId!: string;
}
