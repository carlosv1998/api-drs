import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import {
  CustomNotFoundException,
  CustomUnauthorizedException,
} from 'src/common/exceptions/custom-exceptions';
import { JwtPayload } from 'src/main/strategies/jwt.strategy';
import { EmailsService } from 'src/emails/emails.service';
import { EMAIL_TYPE } from 'src/common/enums/email-type.enum';
import { ORIGIN } from 'src/common/enums/origin.enum';
import { envs } from 'src/config/envs';
import { TokenService } from 'src/tokens/token.service';
import { SessionService } from 'src/sessions/session.service';
import { PermissionsService } from 'src/permissions/permissions.service';

export interface RequestDeviceInfo {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailsService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async register({ origin = ORIGIN.WEB, ...userData }: RegisterDto) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.usersService.create({ ...userData, password: hashedPassword });

    if (origin === ORIGIN.MOBILE) {
      const code = await this.tokenService.createEmailVerificationCode(user.id);

      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Tu código de verificación',
        type: EMAIL_TYPE.NOTIFICATION,
        data: {
          title: 'Código de verificación',
          message: `Tu código de verificación es: <strong>${code}</strong>. Expira en 15 minutos.`,
        },
      });

      return { success: true, hasToValidateEmail: true, userId: user.id };
    }

    const verifyToken = await this.tokenService.createEmailVerificationToken(user.id);

    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Verifica tu correo',
      type: EMAIL_TYPE.EMAIL_VERIFICATION,
      data: {
        firstName: user.firstName,
        verificationUrl: `${envs.web.clientUrl}/auth/verify-email/${verifyToken}`,
      },
    });

    return { success: true, hasToValidateEmail: true };
  }

  async login(
    { email, password, origin = ORIGIN.WEB, deviceName }: LoginDto,
    deviceInfo: RequestDeviceInfo,
  ) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new CustomUnauthorizedException('Invalid credentials');
    }

    const session = await this.sessionService.create({
      userId: user.id,
      deviceType: origin,
      deviceName,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
    });

    const { password: _, ...sanitized } = user;
    const scopes = await this.permissionsService.getEffectiveScopes(user.id);

    return {
      user: sanitized,
      token: this.signToken(user.id, user.email, session.id),
      refreshToken: this.signRefreshToken(user.id, user.email, session.id),
      session: {
        id: session.id,
        deviceType: session.deviceType,
        deviceName: session.deviceName,
        createdAt: session.createdAt,
      },
      scopes,
    };
  }

  async verifyEmail(token: string) {
    const userId = await this.tokenService.validateEmailVerificationToken(token);
    await this.usersService.verifyEmail(userId);
    return { success: true };
  }

  async verifyEmailCode(userId: string, code: string) {
    await this.tokenService.validateEmailVerificationCode(userId, code);
    await this.usersService.verifyEmail(userId);
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    const { password, ...sanitized } = user;
    return sanitized;
  }

  async getSessions(userId: string) {
    return this.sessionService.findAllByUserId(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessionService.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new CustomNotFoundException('Session not found');
    }
    await this.sessionService.delete(sessionId);
    return { success: true };
  }

  async logout(sessionId: string) {
    await this.sessionService.delete(sessionId);
    return { success: true };
  }

  async refresh(refreshTokenStr: string) {
    let payload: JwtPayload & { type?: string };
    try {
      payload = this.jwtService.verify(refreshTokenStr, {
        secret: envs.tokens.refreshTokenKey,
      });
    } catch {
      throw new CustomUnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new CustomUnauthorizedException('Invalid token type');
    }

    const session = await this.sessionService.findById(payload.sessionId);
    if (!session || session.expiresAt < new Date()) {
      if (session) await this.sessionService.delete(session.id);
      throw new CustomUnauthorizedException('Session expired or revoked');
    }

    return { token: this.signToken(payload.sub, payload.email, payload.sessionId) };
  }

  private signToken(userId: string, email: string, sessionId: string): string {
    return this.jwtService.sign({ sub: userId, email, sessionId });
  }

  private signRefreshToken(userId: string, email: string, sessionId: string): string {
    return this.jwtService.sign(
      { sub: userId, email, sessionId, type: 'refresh' },
      {
        secret: envs.tokens.refreshTokenKey,
        expiresIn: Math.floor(envs.tokens.refreshTokenExpiration / 1000),
      },
    );
  }
}
