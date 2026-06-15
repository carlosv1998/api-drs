import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { ScopesModule } from './scopes/scopes.module';
import { RolesModule } from './roles/roles.module';
import { ScopesGuard } from './guards/scopes.guard';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [ScopesModule, RolesModule, UsersModule],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    ScopesGuard,
    {
      provide: APP_GUARD,
      useClass: ScopesGuard,
    },
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
