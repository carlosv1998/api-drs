import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { envs } from 'src/config/envs';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: envs.tokens.accessTokenKey,
      signOptions: { expiresIn: Math.floor(envs.tokens.accessTokenExpiration / 1000) },
    }),
  ],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
