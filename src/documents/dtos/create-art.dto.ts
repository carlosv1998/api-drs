import {
  IsArray,
  IsDefined,
  IsIn,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArtDataDto } from './art-data.dto';

const SIGNER_ROLES = ['participante', 'lider'] as const;
type SignerRole = (typeof SIGNER_ROLES)[number];

export class ArtSignerAssignDto {
  @IsMongoId()
  userId: string;

  @IsString()
  nombre: string;

  @IsString()
  cargo: string;

  @IsIn(SIGNER_ROLES)
  role: SignerRole;
}

export class CreateArtDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ArtDataDto)
  data: ArtDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtSignerAssignDto)
  @IsOptional()
  signers?: ArtSignerAssignDto[];
}
