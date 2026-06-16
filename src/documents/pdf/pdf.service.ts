import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { GcpStorageService } from '../storage/gcp-storage.service';
import { buildArtFileName, fillArt } from './templates/ART/art-pdf.template';
import { CreateArtDtoV2 } from '../dtos/art-data-v2.dto';

@Injectable()
export class PdfService implements OnModuleInit {
  private readonly logger = new Logger(PdfService.name);

  private artTemplateBytes: Buffer;

  constructor(private readonly storageService: GcpStorageService) {}

  onModuleInit() {
    const artPath = path.join(
      process.cwd(),
      'src', 'documents', 'pdf', 'templates', 'ART', 'formato.pdf',
    );
    this.artTemplateBytes = fs.readFileSync(artPath);
    this.logger.log('PDF templates loaded');
  }

  async generateArt(art: CreateArtDtoV2, userId: string): Promise<{ url: string; size: number }> {
    try {
      const pdfDoc = await PDFDocument.load(this.artTemplateBytes);
      await fillArt(pdfDoc, art);

      const buffer = Buffer.from(await pdfDoc.save());
      const filename = `arts/${buildArtFileName(art, userId)}`;
      const url = await this.storageService.upload(buffer, filename, 'application/pdf');

      this.logger.log(`ART generated: ${filename}`);
      return { url, size: buffer.length };
    } catch (error) {
      this.logger.error('Failed to generate ART PDF', error);
      throw new InternalServerErrorException('Failed to generate ART PDF');
    }
  }
}
