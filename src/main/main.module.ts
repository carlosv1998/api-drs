import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from 'src/sessions/session.module';
import { envs } from 'src/config/envs';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: envs.tokens.accessTokenKey,
      signOptions: { expiresIn: Math.floor(envs.tokens.accessTokenExpiration / 1000) },
    }),
    UsersModule,
    SessionsModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [JwtModule, PassportModule, SessionsModule],
})
export class MainModule {}
