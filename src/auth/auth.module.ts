import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { MainModule } from 'src/main/main.module';
import { EmailsModule } from 'src/emails/emails.module';
import { TokensModule } from 'src/tokens/token.module';
import { PermissionsModule } from 'src/permissions/permissions.module';

@Module({
  imports: [UsersModule, MainModule, EmailsModule, TokensModule, PermissionsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
