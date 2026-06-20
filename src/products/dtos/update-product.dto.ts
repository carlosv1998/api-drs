import {
  IsDefined,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';
import { PRODUCT_UPDATE_ACTION } from '../enums';

export class BaseProductUpdateData {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  categoria?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  talla?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}

export class StockUpdateData {
  @IsDefined()
  @IsInt()
  @Min(1)
  cantidad: number;
}

export class UpdateProductDto {
  @IsEnum(PRODUCT_UPDATE_ACTION)
  action: PRODUCT_UPDATE_ACTION;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Transform(({ value, obj }) => {
    switch (obj.action) {
      case PRODUCT_UPDATE_ACTION.BASE_UPDATE:
        return plainToInstance(BaseProductUpdateData, value);
      case PRODUCT_UPDATE_ACTION.ADD_STOCK:
      case PRODUCT_UPDATE_ACTION.SUBTRACT_STOCK:
        return plainToInstance(StockUpdateData, value);
      default:
        return value;
    }
  })
  data: BaseProductUpdateData | StockUpdateData;
}
