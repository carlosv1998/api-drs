import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { ScopesModule } from './scopes/scopes.module';
import { RolesModule } from './roles/roles.module';
import { ScopesGuard } from './guards/scopes.guard';

@Module({
  imports: [ScopesModule, RolesModule],
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
