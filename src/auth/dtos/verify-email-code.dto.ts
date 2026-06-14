import { IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailCodeDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
