import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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

type DocumentRow = Awaited<ReturnType<PrismaService['document']['findUniqueOrThrow']>> & {
  data: unknown;
  signatures: unknown;
  pendingSignerIds: string[];
};

@Injectable()
export class DocumentsService {
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

  async signArt(documentId: string, userId: string, dto: SignArtDto) {
    const doc = (await this.findById(documentId)) as DocumentRow;

    if (
      doc.status !== DOCUMENT_STATUS.PENDIENTE_FIRMAS &&
      doc.status !== DOCUMENT_STATUS.PENDIENTE_LIDER
    ) {
      throw new BadRequestException('Document is not awaiting signatures');
    }

    const signatures = doc.signatures as ArtSignatures | null;
    if (!signatures) throw new BadRequestException('Document has no signing workflow');

    const isLider = signatures.lider?.userId === userId;
    const participanteIdx = signatures.participantes.findIndex((p) => p.userId === userId);
    const isParticipante = participanteIdx !== -1;

    if (!isLider && !isParticipante) {
      throw new ForbiddenException('You are not a signer for this document');
    }

    const signatureUrl = await this.uploadSignatureImage(dto.signature, userId, documentId);

    // Copy to mutate safely
    const updated: ArtSignatures = {
      lider: signatures.lider ? { ...signatures.lider } : null,
      participantes: signatures.participantes.map((p) => ({ ...p })),
    };

    if (isLider) {
      if (updated.lider!.hasSigned) throw new BadRequestException('Already signed');
      if (doc.status !== DOCUMENT_STATUS.PENDIENTE_LIDER) {
        throw new BadRequestException('Participants must sign before the leader');
      }
      updated.lider = {
        ...updated.lider!,
        verificoCondiciones: dto.verificoCondiciones ?? null,
        hasSigned: true,
        signedAt: new Date().toISOString(),
        signatureUrl,
      };
    } else {
      if (updated.participantes[participanteIdx].hasSigned) {
        throw new BadRequestException('Already signed');
      }
      updated.participantes[participanteIdx] = {
        ...updated.participantes[participanteIdx],
        enCondiciones: dto.enCondiciones ?? null,
        hasSigned: true,
        signedAt: new Date().toISOString(),
        signatureUrl,
      };
    }

    const pendingSignerIds = [
      ...updated.participantes.filter((p) => !p.hasSigned).map((p) => p.userId),
      ...(updated.lider && !updated.lider.hasSigned ? [updated.lider.userId] : []),
    ];

    const allParticipantesSigned = updated.participantes.every((p) => p.hasSigned);
    const liderSigned = updated.lider ? updated.lider.hasSigned : true;

    let newStatus = doc.status;

    if (allParticipantesSigned && !liderSigned && doc.status === DOCUMENT_STATUS.PENDIENTE_FIRMAS) {
      newStatus = DOCUMENT_STATUS.PENDIENTE_LIDER;
      // TODO: notificar al líder (updated.lider!.userId) que puede firmar
    }

    if (allParticipantesSigned && liderSigned) {
      newStatus = DOCUMENT_STATUS.COMPLETADO;
      // TODO: notificar al creador (doc.createdBy) que el ART está completado
      // TODO: regenerar PDF final con las firmas embebidas visualmente
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: { signatures: updated as unknown as Prisma.InputJsonValue, pendingSignerIds, status: newStatus },
    });
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
