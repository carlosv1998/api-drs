import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { TOKEN_TYPE } from 'src/common/enums/token-type.enum';

export class CreateTokenDto {
  @IsEnum(TOKEN_TYPE)
  @IsNotEmpty()
  type: TOKEN_TYPE;

  @IsMongoId()
  @IsNotEmpty()
  profileId: string;
}
