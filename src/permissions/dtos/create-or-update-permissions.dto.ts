import { IsArray, IsMongoId, IsOptional } from 'class-validator';

export class CreateOrUpdatePermissionsDto {
  @IsMongoId({ each: true })
  @IsArray()
  userIds: string[];

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
}
