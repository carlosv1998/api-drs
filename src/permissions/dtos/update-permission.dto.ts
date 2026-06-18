import { IsArray, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PERMISSION_JOB_TITLE } from '../enums/job-title.enum';

export class UpdatePermissionDto {
  @IsMongoId()
  userId: string;

  @IsMongoId({ each: true })
  @IsArray()
  @IsOptional()
  roles?: string[];

  @IsMongoId({ each: true })
  @IsArray()
  @IsOptional()
  allowedScopes?: string[];

  @IsMongoId({ each: true })
  @IsArray()
  @IsOptional()
  deniedScopes?: string[];

  @IsEnum(PERMISSION_JOB_TITLE)
  jobTitle?: PERMISSION_JOB_TITLE;
}
