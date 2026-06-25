import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMaintenanceBodyDto {
  @IsOptional()
  @IsISO8601()
  performedAt?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  mileageAtService?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    try { return JSON.parse(value); } catch { return []; }
  })
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
