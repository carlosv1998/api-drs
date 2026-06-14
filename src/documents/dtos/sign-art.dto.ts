import { IsIn, IsOptional, IsString } from 'class-validator';

const SINO = ['si', 'no'] as const;

export class SignArtDto {
  @IsString()
  signature: string; // base64 dataUrl (data:image/png;base64,...)

  @IsIn(SINO)
  @IsOptional()
  enCondiciones?: 'si' | 'no'; // participantes

  @IsIn(SINO)
  @IsOptional()
  verificoCondiciones?: 'si' | 'no'; // líder
}
