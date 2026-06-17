import {
  IsDefined,
  IsEnum,
  IsInt,
  IsISO8601,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';
import { VEHICLE_TYPE, VEHICLE_UPDATE_ACTION } from '../enums';

// ─── data DTOs ──────────────────────────────────────────────────────────────

export class BaseVehicleUpdateData {
  @IsOptional()
  @IsEnum(VEHICLE_TYPE)
  type?: VEHICLE_TYPE;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsISO8601()
  nextMaintenance?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maintainMileageInterval?: number;
}

export class AddMaintenanceData {
  @IsISO8601()
  performedAt: string;

  @IsInt()
  @Min(0)
  mileageAtService: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaintenanceData {
  @IsMongoId()
  maintenanceId: string;

  @IsOptional()
  @IsISO8601()
  performedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileageAtService?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DeleteMaintenanceData {
  @IsMongoId()
  maintenanceId: string;
}

// ─── main DTO ────────────────────────────────────────────────────────────────

export class UpdateVehicleDto {
  @IsEnum(VEHICLE_UPDATE_ACTION)
  action: VEHICLE_UPDATE_ACTION;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Transform(({ value, obj }) => {
    switch (obj.action) {
      case VEHICLE_UPDATE_ACTION.BASE_UPDATE:
        return plainToInstance(BaseVehicleUpdateData, value);
      case VEHICLE_UPDATE_ACTION.ADD_MAINTENANCE:
        return plainToInstance(AddMaintenanceData, value);
      case VEHICLE_UPDATE_ACTION.UPDATE_MAINTENANCE:
        return plainToInstance(UpdateMaintenanceData, value);
      case VEHICLE_UPDATE_ACTION.DELETE_MAINTENANCE:
        return plainToInstance(DeleteMaintenanceData, value);
      default:
        return value;
    }
  })
  data: BaseVehicleUpdateData | AddMaintenanceData | UpdateMaintenanceData | DeleteMaintenanceData;
}
