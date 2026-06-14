import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { CleanChileanRut, IsChileanRut } from 'src/common/validators/is-chilean-rut';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @CleanChileanRut()
  @IsChileanRut()
  rut: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsBoolean()
  @IsOptional()
  emailVerified: boolean = false;
}
