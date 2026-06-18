import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsController } from './notifications.controller';
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
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
