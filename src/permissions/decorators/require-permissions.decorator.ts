import { SetMetadata } from '@nestjs/common';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

export const SCOPES_KEY = 'required_scopes';
export const RequirePermissions = (scopes: SCOPE_NAME[]) =>
  SetMetadata(SCOPES_KEY, scopes);
