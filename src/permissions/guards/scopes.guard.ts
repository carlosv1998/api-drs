import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/require-permissions.decorator';
import { PermissionsService } from '../permissions.service';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScopes = this.reflector.getAllAndOverride<SCOPE_NAME[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes || requiredScopes.length === 0) return true;

    const user = context.switchToHttp().getRequest().user;
    if (!user) return false;

    return this.permissionsService.hasAnyScope(user.id, requiredScopes);
  }
}
