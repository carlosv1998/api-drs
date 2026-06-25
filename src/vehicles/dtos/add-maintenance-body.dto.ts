import { Transform } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export class AddMaintenanceBodyDto {
  @IsISO8601()
  performedAt: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  mileageAtService: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
