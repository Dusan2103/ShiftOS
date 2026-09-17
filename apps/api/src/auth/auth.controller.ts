import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  prijava(@Body() dto: LoginDto, @Headers('x-client-platform') platforma?: string) {
    return this.authService.prijava(dto.email, dto.lozinka, platforma === 'android');
  }
}
