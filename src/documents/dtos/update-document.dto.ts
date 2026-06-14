import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DOCUMENT_STATUS } from 'src/common/enums/document-status.enum';

export class UpdateDocumentDto {
  @IsEnum(DOCUMENT_STATUS)
  @IsOptional()
  status?: DOCUMENT_STATUS;

  @IsString()
  @IsOptional()
  description?: string;
}
