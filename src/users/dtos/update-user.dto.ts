import { IsOptional, IsString } from 'class-validator';
import { CleanChileanRut, IsChileanRut, validateChileanRut } from 'src/common/validators/is-chilean-rut';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsOptional()
  @CleanChileanRut()
  @IsChileanRut()
  rut?: string;
}
