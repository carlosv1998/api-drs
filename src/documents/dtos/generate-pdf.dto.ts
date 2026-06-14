import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DOCUMENT_TYPE } from 'src/common/enums/document-type.enum';

export class GeneratePdfDto {
  @IsString()
  @IsNotEmpty()
  html: string;

  @IsEnum(DOCUMENT_TYPE)
  type: DOCUMENT_TYPE;

  @IsString()
  @IsOptional()
  description?: string;
}
