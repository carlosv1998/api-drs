import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MainModule } from './main/main.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailsModule } from './emails/emails.module';
import { TokensModule } from './tokens/token.module';
import { PermissionsModule } from './permissions/permissions.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MainModule,
    UsersModule,
    EmailsModule,
    TokensModule,
    AuthModule,
    PermissionsModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
