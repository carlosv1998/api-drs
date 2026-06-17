import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsString()
  @MinLength(1)
  categoria: string;

  @IsString()
  @MinLength(1)
  talla: string;

  @IsInt()
  @Min(0)
  stock: number;
}
