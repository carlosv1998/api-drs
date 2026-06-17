import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GcpStorageService } from './storage/gcp-storage.service';
import { PdfService } from './pdf/pdf.service';
import { UploadDocumentDto } from './dtos/upload-document.dto';
import { UpdateDocumentDto } from './dtos/update-document.dto';
import { CreateArtDto } from './dtos/create-art.dto';
import { SignArtDto } from './dtos/sign-art.dto';
import { ArtDataDto } from './dtos/art-data.dto';
import { DOCUMENT_STATUS } from 'src/common/enums/document-status.enum';
import { DOCUMENT_TYPE } from 'src/common/enums/document-type.enum';
import { DOCUMENT_MIMETYPE } from 'src/common/enums/document-mimetype.enum';
import { ArtData } from './pdf/templates/ART/art-pdf.types';
import { ArtSignatures } from './pdf/templates/ART/art-signatures.types';
import { calculateArtStatus } from './utils/art-status.util';
import { Prisma } from '@prisma/client';
import { envs } from 'src/config/envs';
import { CreateArtDtoV2 } from './dtos/art-data-v2.dto';
import { IDocumentArtData } from './interfaces/document-art-data.interface';
import { FilterDto, PaginationDto } from 'src/common/dtos/filter.dto';
import { IPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { PrismaHelper } from 'src/common/helpers/prisma.helper';

type DocumentRow = Awaited<ReturnType<PrismaService['document']['findUniqueOrThrow']>> & {
  data: unknown;
  signatures: unknown;
  pendingSignerIds: string[];
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: GcpStorageService,
    private readonly pdfService: PdfService,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string, data: UploadDocumentDto) {
    const filename = `documents/${userId}/${Date.now()}-${file.originalname}`;
    const url = await this.storageService.upload(file.buffer, filename, file.mimetype);

    return this.prisma.document.create({
      data: {
        createdBy: userId,
        type: data.type,
        description: data.description,
        url,
        status: DOCUMENT_STATUS.CREADO,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  }

  async createArt(userId: string, artData: CreateArtDtoV2) {
    let url: string | null = null;
    let size: number | null = null;
    const pdf = await this.pdfService.generateArt(artData, userId);
    url = pdf.url;
    size = pdf.size;

    const finalArtData: IDocumentArtData = {
      ...artData,
      condicionesFisicas: {
        ...artData.condicionesFisicas,
        liderFirma: Boolean(artData.condicionesFisicas.liderFirma),
      },
      participantes: artData.participantes.map((p) => ({
        ...p,
        participanteFirma: Boolean(p.participanteFirma),
      }))
    }

    const doc = await this.prisma.document.create({
      data: {
        createdBy: userId,
        type: DOCUMENT_TYPE.ART,
        status: DOCUMENT_STATUS.COMPLETADO,
        url,
        size,
        mimetype: url ? DOCUMENT_MIMETYPE.PDF : null,
        data: finalArtData as unknown as Prisma.InputJsonValue,
      },
    });

    return doc;
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto?: FilterDto,
  ): Promise<IPaginatedResponse<any>> {
    const where = PrismaHelper.buildWhere(filterDto);
    const orderBy = PrismaHelper.buildOrderBy(filterDto);

    const result = await PrismaHelper.paginate(
      (args) => this.prisma.document.findMany({ ...args }),
      (args) => this.prisma.document.count(args),
      paginationDto,
      where,
      orderBy,
    );

    this.logger.log(`Documents found: ${result.pagination.total}`);
    return result;
  }

  async findById(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async update(id: string, userId: string, data: UpdateDocumentDto) {
    await this.findById(id);
    return this.prisma.document.update({ where: { id, createdBy: userId }, data });
  }

  async delete(id: string, userId: string) {
    const doc = await this.findById(id);

    if (doc.url) {
      const filename = doc.url.split(`storage.googleapis.com/`)[1]?.split('/').slice(1).join('/');
      if (filename) await this.storageService.delete(filename).catch(() => {});
    }

    await this.prisma.document.delete({ where: { id, createdBy: userId } });
    return { success: true };
  }

  async getSignedUrl(id: string, expiresInSeconds = 3600) {
    const doc = await this.findById(id);
    if (!doc.url) throw new NotFoundException('Document has no file');

    const filename = doc.url.split(`storage.googleapis.com/${envs.gcp.bucketName}/`)[1];
    const signedUrl = await this.storageService.getSignedUrl(filename, expiresInSeconds);
    return { url: signedUrl, expiresIn: expiresInSeconds };
  }

  private async uploadSignatureImage(
    base64DataUrl: string,
    userId: string,
    documentId: string,
  ): Promise<string> {
    const match = base64DataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (!match) throw new BadRequestException('Invalid signature — expected base64 dataUrl');

    const [, mimeType, b64] = match;
    const ext = mimeType.split('/')[1];
    const buffer = Buffer.from(b64, 'base64');
    return this.storageService.upload(buffer, `signatures/${userId}/${documentId}.${ext}`, mimeType);
  }
}
