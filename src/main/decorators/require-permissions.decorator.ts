import { SetMetadata, applyDecorators } from '@nestjs/common';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionsMetadata {
  permissions: SCOPE_NAME[];
}

export const RequirePermissions = (permissions: SCOPE_NAME[]) => {
  return applyDecorators(SetMetadata(PERMISSIONS_KEY, permissions));
};
