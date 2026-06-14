import { IsArray, IsEnum } from 'class-validator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';

export class ValidateScopesDto {
  @IsArray()
  @IsEnum(SCOPE_NAME, { each: true })
  scopes: SCOPE_NAME[];
}
