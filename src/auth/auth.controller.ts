import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { VerifyEmailCodeDto } from './dtos/verify-email-code.dto';
import { Public } from 'src/main/decorators/public.decorator';
import { GetUser } from 'src/main/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() data: RegisterDto) {
    this.logger.debug('Received request to register');
    return this.authService.register(data);
  }

  @Public()
  @Post('login')
  async login(@Body() data: LoginDto, @Req() req: Request) {
    this.logger.debug('Received request to login');
    return this.authService.login(data, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() { token }: VerifyEmailDto) {
    this.logger.debug('Received request to verify email via link');
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('verify-email-code')
  async verifyEmailCode(@Body() { userId, code }: VerifyEmailCodeDto) {
    this.logger.debug('Received request to verify email via code');
    return this.authService.verifyEmailCode(userId, code);
  }

  @Get('me')
  async me(@GetUser('id') userId: string) {
    this.logger.debug('Received request to get current user');
    return this.authService.me(userId);
  }

  @Get('sessions')
  async getSessions(@GetUser('id') userId: string) {
    this.logger.debug('Received request to list sessions');
    return this.authService.getSessions(userId);
  }

  @Delete('sessions/logout')
  async logout(@GetUser('sessionId') sessionId: string) {
    this.logger.debug('Received request to logout');
    return this.authService.logout(sessionId);
  }

  @Delete('sessions/:id')
  async revokeSession(
    @GetUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    this.logger.debug(`Received request to revoke session ${sessionId}`);
    return this.authService.revokeSession(userId, sessionId);
  }
}
