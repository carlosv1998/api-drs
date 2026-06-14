import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DOCUMENT_TYPE } from 'src/common/enums/document-type.enum';

export class UploadDocumentDto {
  @IsEnum(DOCUMENT_TYPE)
  type: DOCUMENT_TYPE;

  @IsString()
  @IsOptional()
  description?: string;
}
