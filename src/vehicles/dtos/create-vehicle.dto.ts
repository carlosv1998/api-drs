import { IsEnum, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { VEHICLE_TYPE } from '../enums';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  patent: string;

  @IsEnum(VEHICLE_TYPE)
  type: VEHICLE_TYPE;

  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;

  @IsISO8601()
  @IsOptional()
  nextMaintenance?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maintainMileageInterval?: number;
}
