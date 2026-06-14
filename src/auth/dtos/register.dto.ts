import { IsEnum, IsOptional } from 'class-validator';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { ORIGIN } from 'src/common/enums/origin.enum';

export class RegisterDto extends CreateUserDto {
  @IsEnum(ORIGIN)
  @IsOptional()
  origin?: ORIGIN;
}
