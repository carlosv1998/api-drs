import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from 'src/config/envs';
import { UsersService } from 'src/users/users.service';
import { SessionService } from 'src/sessions/session.service';

export interface JwtPayload {
  sub: string;
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.tokens.accessTokenKey,
    });
  }

  async validate(payload: JwtPayload) {
    const session = await this.sessionService.findById(payload.sessionId);

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.sessionService.delete(session.id);
      throw new UnauthorizedException('Session expired or revoked');
    }

    // Fire-and-forget: no bloqueamos el request
    this.sessionService.updateLastActive(payload.sessionId).catch(() => {});

    try {
      const user = await this.usersService.findById(payload.sub);
      return { id: user.id, email: user.email, sessionId: payload.sessionId };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
