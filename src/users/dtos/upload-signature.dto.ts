import { IsString, Matches } from 'class-validator';

export class UploadSignatureDto {
  @IsString()
  @Matches(/^data:image\/(png|jpeg|svg\+xml);base64,/, {
    message: 'signature must be a valid base64 image (png, jpeg or svg)',
  })
  signature: string;
}
