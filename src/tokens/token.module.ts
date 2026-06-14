import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { envs } from 'src/config/envs';

@Module({
  imports: [
    JwtModule.register({
      secret: envs.tokens.accessTokenKey,
      signOptions: { expiresIn: Math.floor(envs.tokens.accessTokenExpiration / 1000) },
    }),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokensModule {}
