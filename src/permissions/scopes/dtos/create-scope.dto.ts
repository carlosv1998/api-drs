import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateScopeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  module: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
