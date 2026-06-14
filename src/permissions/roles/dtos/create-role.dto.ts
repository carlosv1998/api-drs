import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PERMISSION_PRIORITY } from 'src/common/enums/permission-priority.enum';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsMongoId({ each: true })
  @IsArray()
  scopeList?: string[];

  @IsEnum(PERMISSION_PRIORITY)
  priority: PERMISSION_PRIORITY;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
