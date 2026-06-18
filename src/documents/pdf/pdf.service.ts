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
import { buildArtFileName, fillArt } from './templates/ART/art-pdf-fill';
import { CreateArtDtoV2 } from '../dtos/art-data-v2.dto';
import { CreateCapacitacionDifusionDataDto } from '../dtos/capacitacion-difusion-data.dto';
import { IDocumentCapacitacionDifusionRelatorData, IDocumentCapacitacionDifusionTrabajadorData } from '../interfaces/document-capacitacion-difusion-data.interface';
import { buildCapacitacionDifusionFileName, fillCapacitacionDifusion } from './templates/CapacitacionDifusion/difusion-pdf-fill';

@Injectable()
export class PdfService implements OnModuleInit {
  private readonly logger = new Logger(PdfService.name);

  private artTemplateBytes: Buffer;
  private capacitacionDifusionTemplateBytes: Buffer;

  constructor(private readonly storageService: GcpStorageService) {}

  onModuleInit() {
    const artPath = path.join(
      process.cwd(),
      'src', 'documents', 'pdf', 'templates', 'ART', 'formato.pdf',
    );
    const capacitacionDifusionPath = path.join(
      process.cwd(),
      'src', 'documents', 'pdf', 'templates', 'CapacitacionDifusion', 'formato-fda.pdf'
    );
    this.artTemplateBytes = fs.readFileSync(artPath);
    this.capacitacionDifusionTemplateBytes = fs.readFileSync(capacitacionDifusionPath);
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

  async generateCapacitacionDifusion({
    docId,
    relator,
    participantes,
    capacitacionDifusionData,
  }: {
    docId: string;
    relator: IDocumentCapacitacionDifusionRelatorData;
    participantes: IDocumentCapacitacionDifusionTrabajadorData[];
    capacitacionDifusionData: CreateCapacitacionDifusionDataDto;
  }): Promise<{ url: string; size: number }> {
    try {
      const pdfDoc = await PDFDocument.create();
      await fillCapacitacionDifusion(
        pdfDoc,
        this.capacitacionDifusionTemplateBytes,
        capacitacionDifusionData,
        relator,
        participantes,
      );

      const buffer = Buffer.from(await pdfDoc.save());
      const filename = buildCapacitacionDifusionFileName(docId, capacitacionDifusionData.fecha);
      const url = await this.storageService.upload(buffer, filename, 'application/pdf');

      this.logger.log(`CapacitacionDifusion generated: ${filename}`);
      return { url, size: buffer.length };
    } catch (error) {
      this.logger.error('Failed to generate CapacitacionDifusion PDF', error);
      throw new InternalServerErrorException('Failed to generate CapacitacionDifusion PDF');
    }
  }
}
