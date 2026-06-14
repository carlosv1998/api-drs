import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageSize?: number = 20;
}

export class FilterDto {
  @IsOptional()
  @IsObject()
  search?: Record<string, string>;

  @IsOptional()
  @IsObject()
  filter?: Record<string, any>;

  @IsOptional()
  @IsObject()
  sort?: Record<string, string>;

  @IsOptional()
  @IsObject()
  startDate?: Record<string, string>;

  @IsOptional()
  @IsObject()
  endDate?: Record<string, string>;
}

/**
 * Combined query DTO for paginated + filtered endpoints.
 * Use with @Query() so the global ValidationPipe (whitelist + forbidNonWhitelisted)
 * receives a single validated shape instead of two separate @Query() params.
 *
 * @example
 * @Get()
 * findAll(@Query() query: PaginatedQueryDto) {
 *   const { page, pageSize, filterDto } = query;
 *   return this.service.findAll({ page, pageSize }, filterDto);
 * }
 */
export class PaginatedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageSize?: number = 20;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDto)
  filterDto?: FilterDto;
}
