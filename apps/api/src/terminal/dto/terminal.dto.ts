import { IsOptional, IsString, MinLength } from 'class-validator';

export class RegistrujTerminalDto {
  @IsString()
  @MinLength(1)
  sektorId!: string;

  @IsOptional()
  @IsString()
  naziv?: string;
}

export class IzmeniTerminalDto extends RegistrujTerminalDto {}
