import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';
import { VEHICLE_TYPE } from '../enums';

export class UpdateVehicleBaseBodyDto {
  @IsOptional()
  @IsEnum(VEHICLE_TYPE)
  type?: VEHICLE_TYPE;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsISO8601()
  nextMaintenance?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(1)
  maintainMileageInterval?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    try { return JSON.parse(value); } catch { return undefined; }
  })
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
