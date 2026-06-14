import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ORIGIN } from 'src/common/enums/origin.enum';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(ORIGIN)
  @IsOptional()
  origin?: ORIGIN;

  @IsString()
  @IsOptional()
  deviceName?: string;
}
