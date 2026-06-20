import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GcpStorageService } from './storage/gcp-storage.service';
import { PdfService } from './pdf/pdf.service';
import { DOCUMENT_STATUS } from 'src/common/enums/document-status.enum';
import { DOCUMENT_MIMETYPE } from 'src/common/enums/document-mimetype.enum';
import { envs } from 'src/config/envs';
import { CreateArtDtoV2 } from './dtos/art-data-v2.dto';
import { FilterDto, PaginationDto } from 'src/common/dtos/filter.dto';
import { IPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { PrismaHelper } from 'src/common/helpers/prisma.helper';
import { CreateCapacitacionDifusionDataDto } from './dtos/capacitacion-difusion-data.dto';
import { CustomBadRequestException, CustomNotFoundException } from 'src/common/exceptions/custom-exceptions';
import { CAPACITACION_DIFUSION_ERRORS } from './errors';
import { IDocumentCapacitacionDifusionRelatorData, IDocumentCapacitacionDifusionTrabajadorData } from './interfaces/document-capacitacion-difusion-data.interface';
import { BASE_PROYECT_NAME } from './pdf/constants';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: GcpStorageService,
    private readonly pdfService: PdfService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createArt(userId: string, artData: CreateArtDtoV2) {
    let url: string | null = null;
    let size: number | null = null;
    const pdf = await this.pdfService.generateArt(artData, userId);
    url = pdf.url;
    size = pdf.size;

    const doc = await this.prisma.artDocument.create({
      data: {
        createdBy: userId,
        status: DOCUMENT_STATUS.COMPLETADO,
        url,
        size,
        mimetype: url ? DOCUMENT_MIMETYPE.PDF : null,
        planificacion: artData.planificacion,
        preguntasTransversalesSupervisor: artData.preguntasTransversalesSupervisor,
        preguntasTransversalesTrabajador: artData.preguntasTransversalesTrabajador,
        riesgosCriticosSupervisor: artData.riesgosCriticosSupervisor,
        riesgosCriticosTrabajador: artData.riesgosCriticosTrabajador,
        otrosRiesgos: artData.otrosRiesgos,
        trabajosSimultaneo: artData.trabajosSimultaneo ?? null,
        condicionesFisicas: {
          ...artData.condicionesFisicas,
          liderFirma: Boolean(artData.condicionesFisicas.liderFirma),
        },
        participantes: artData.participantes.map((p) => ({
          ...p,
          participanteFirma: Boolean(p.participanteFirma),
        })),
      },
    });

    return doc;
  }

  async createCapacitacionDifusion(createdById: string, capacitacionDifusionData: CreateCapacitacionDifusionDataDto) {
    const createdByUser = await this.prisma.user.findUnique({ where: { id: createdById } });

    if (!createdByUser) {
      throw new CustomNotFoundException(
        'User not found',
        CAPACITACION_DIFUSION_ERRORS.USER_NOT_FOUND
      )
    }

    const relatorUser = await this.prisma.user.findUnique({
      where: { id: capacitacionDifusionData.relatorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rut: true,
        signatureUrl: true,
        permission: {
          select: {
            jobTitle: true
          },
        },
      },
    });

    if (!relatorUser) {
      throw new CustomNotFoundException(
        'Relator not found',
        CAPACITACION_DIFUSION_ERRORS.RELATOR_NOT_FOUND
      )
    }

    if (!relatorUser.signatureUrl) {
      throw new CustomNotFoundException(
        'Relator signature not found',
        CAPACITACION_DIFUSION_ERRORS.RELATOR_SIGNATURE_NOT_FOUND
      )
    }

    if (!relatorUser.permission?.jobTitle){
      throw new CustomNotFoundException(
        'Relator job title not found',
        CAPACITACION_DIFUSION_ERRORS.RELATOR_JOB_TITLE_NOT_FOUND
      )
    }

    const trabajadoresUsers = await this.prisma.user.findMany({
      where: {
        id: {
          in: capacitacionDifusionData.listaParticipantes,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rut: true,
        permission: {
          select: {
            jobTitle: true,
          },
        },
      },
    });

    if (trabajadoresUsers.length === 0 || trabajadoresUsers.length !== capacitacionDifusionData.listaParticipantes.length) {
      throw new CustomNotFoundException(
        'Trabajadores not found',
        CAPACITACION_DIFUSION_ERRORS.TRABAJADORES_NOT_FOUND
      )
    }

    let trabajadoresSinCargo: { id: string; rut: string; }[] = [];

    trabajadoresUsers.forEach((user) => {
      if (!user.permission?.jobTitle) {
        trabajadoresSinCargo.push({ id: user.id, rut: user.rut });
      }
    });

    if (trabajadoresSinCargo.length > 0) {
      throw new CustomNotFoundException(
        'Trabajadores job title not found',
        CAPACITACION_DIFUSION_ERRORS.TRABAJADORES_JOB_TITLE_NOT_FOUND,
        { trabajadoresSinCargo }
      )
    }

    const relatorData: IDocumentCapacitacionDifusionRelatorData = {
      nombre: `${relatorUser.firstName} ${relatorUser.lastName}`,
      rut: relatorUser.rut,
      cargo: relatorUser.permission?.jobTitle,
      firma: relatorUser.signatureUrl
    }

    const trabajadoresData = trabajadoresUsers.map((trabajador) => ({
      nombre: `${trabajador.firstName} ${trabajador.lastName}`,
      rut: trabajador.rut,
      cargo: trabajador.permission!.jobTitle,
      proyecto: capacitacionDifusionData.proyecto ?? BASE_PROYECT_NAME
    }))

    const { listaParticipantes, proyecto, ...documentFields } = capacitacionDifusionData;

    const documentCapacitacionDifusion = await this.prisma.capacitacionDifusionDocument.create({
      data: {
        ...documentFields,
        createdById: createdByUser.id,
      },
    });

    await this.prisma.capacitacionDifusionParticipante.createMany({
      data: listaParticipantes.map((userId) => ({
        documentId: documentCapacitacionDifusion.id,
        userId,
      })),
    });

    const documentInfo = await this.pdfService.generateCapacitacionDifusion({
      docId: documentCapacitacionDifusion.id,
      relator: relatorData,
      participantes: trabajadoresData,
      capacitacionDifusionData,
    });

    const updatedDocument = await this.prisma.capacitacionDifusionDocument.update({
      where: { id: documentCapacitacionDifusion.id },
      data: {
        url: documentInfo.url,
        size: documentInfo.size,
        status: DOCUMENT_STATUS.COMPLETADO,
        mimetype: DOCUMENT_MIMETYPE.PDF,
      },
    });

    await this.notificationsService.send({
      userIds: capacitacionDifusionData.listaParticipantes,
      type: NotificationType.FIRMA_DOCUMENTO,
      title: 'Nuevo documento para firmar',
      body: `${relatorData.nombre} ha registrado una capacitación que requiere tu firma.`,
      route: `/documentos/capacitacion/${updatedDocument.id}`,
      payload: { documentId: updatedDocument.id },
    });

    return updatedDocument;
  }

  async findMisCapacitacionDocumentos(userId: string, paginationDto: PaginationDto) {
    const where = { participantes: { some: { userId } } };
    return PrismaHelper.paginate(
      (args) =>
        this.prisma.capacitacionDifusionDocument.findMany({
          ...args,
          include: {
            relator: { select: { firstName: true, lastName: true } },
            participantes: { where: { userId }, select: { signedAt: true } },
          },
        }),
      (args) => this.prisma.capacitacionDifusionDocument.count({ ...args }),
      paginationDto,
      where,
    );
  }

  async findMyCapacitacionDifusionById(id: string, userId: string) {
    const participante = await this.prisma.capacitacionDifusionParticipante.findFirst({
      where: { documentId: id, userId },
    });
    if (!participante) throw new NotFoundException('Document not found');

    return this.findCapacitacionDifusionById(id, userId);
  }

  async findCapacitacionDifusionById(id: string, userId: string) {
    const doc = await this.prisma.capacitacionDifusionDocument.findUnique({
      where: { id },
      include: {
        relator: {
          select: {
            firstName: true,
            lastName: true,
            permission: { select: { jobTitle: true } },
          },
        },
        participantes: {
          include: {
            user: { select: { firstName: true, lastName: true, rut: true } },
          },
        },
      },
    });

    if (!doc) throw new NotFoundException('Document not found');

    let signedUrl: string | null = null;
    if (doc.url) {
      try {
        const filename = doc.url.split(`storage.googleapis.com/${envs.gcp.bucketName}/`)[1];
        signedUrl = await this.storageService.getSignedUrl(filename, 3600);
      } catch {}
    }

    const miFirma = doc.participantes.find((p) => p.userId === userId) ?? null;

    return { ...doc, signedUrl, miFirma };
  }

  async firmarCapacitacionDifusion(documentId: string, userId: string) {
    const participante = await this.prisma.capacitacionDifusionParticipante.findFirst({
      where: { documentId, userId },
    });
    if (!participante) throw new NotFoundException('No eres participante de este documento');
    if (participante.signedAt) {
      throw new CustomBadRequestException(
        'Ya firmaste este documento',
        CAPACITACION_DIFUSION_ERRORS.ALREADY_SIGNED,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { signatureUrl: true },
    });

    if (!user || !user.signatureUrl) {
      throw new CustomBadRequestException(
        'No tienes firma para este documento',
        CAPACITACION_DIFUSION_ERRORS.NO_SIGNATURE,
      );
    }

    await this.prisma.capacitacionDifusionParticipante.update({
      where: { id: participante.id },
      data: { signedAt: new Date(), signature: user.signatureUrl },
    });

    await this.regenerarCapacitacionDifusionPdf(documentId);

    return { success: true };
  }

  private async regenerarCapacitacionDifusionPdf(documentId: string): Promise<void> {
    const doc = await this.prisma.capacitacionDifusionDocument.findUnique({
      where: { id: documentId },
      include: {
        relator: {
          select: {
            firstName: true,
            lastName: true,
            rut: true,
            signatureUrl: true,
            permission: { select: { jobTitle: true } },
          },
        },
        participantes: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                rut: true,
                permission: { select: { jobTitle: true } },
              },
            },
          },
        },
      },
    });

    if (!doc || !doc.url) return;

    const relatorData: IDocumentCapacitacionDifusionRelatorData = {
      nombre: `${doc.relator.firstName} ${doc.relator.lastName}`,
      rut: doc.relator.rut,
      cargo: doc.relator.permission?.jobTitle ?? '',
      firma: doc.relator.signatureUrl ?? '',
    };

    const participantesData: IDocumentCapacitacionDifusionTrabajadorData[] =
      doc.participantes.map((p) => ({
        nombre: `${p.user.firstName} ${p.user.lastName}`,
        rut: p.user.rut,
        cargo: p.user.permission?.jobTitle ?? '',
        proyecto: BASE_PROYECT_NAME,
        firma: p.signature ?? undefined,
      }));

    try {
      const oldFilename = doc.url.split(`storage.googleapis.com/${envs.gcp.bucketName}/`)[1];
      if (oldFilename) await this.storageService.delete(oldFilename).catch(() => {});
    } catch {}

    const documentInfo = await this.pdfService.generateCapacitacionDifusion({
      docId: doc.id,
      relator: relatorData,
      participantes: participantesData,
      capacitacionDifusionData: {
        codigo: doc.codigo,
        revision: doc.revision,
        tipoActividad: doc.tipoActividad as any,
        modalidad: doc.modalidad as any,
        asistencia: doc.asistencia as any,
        relatorId: doc.relatorId,
        ubicacion: doc.ubicacion,
        temaPrincipal: doc.temaPrincipal,
        listaParticipantes: doc.participantes.map((p) => p.userId),
        fecha: doc.fecha,
        horaInicio: doc.horaInicio,
        horaTermino: doc.horaTermino,
      },
    });

    await this.prisma.capacitacionDifusionDocument.update({
      where: { id: documentId },
      data: { url: documentInfo.url, size: documentInfo.size },
    });
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto?: FilterDto,
  ): Promise<IPaginatedResponse<any>> {
    const where = PrismaHelper.buildWhere(filterDto);
    const orderBy = PrismaHelper.buildOrderBy(filterDto);

    const result = await PrismaHelper.paginate(
      (args) => this.prisma.artDocument.findMany({ ...args }),
      (args) => this.prisma.artDocument.count(args),
      paginationDto,
      where,
      orderBy,
    );

    this.logger.log(`Documents found: ${result.pagination.total}`);
    return result;
  }

  async findAllCapacitacionDifusionDocuments(
    paginationDto: PaginationDto,
    filterDto?: FilterDto,
  ): Promise<IPaginatedResponse<any>> {
    const where = PrismaHelper.buildWhere(filterDto);
    const orderBy = PrismaHelper.buildOrderBy(filterDto);

    const result = await PrismaHelper.paginate(
      (args) => this.prisma.capacitacionDifusionDocument.findMany({ ...args }),
      (args) => this.prisma.capacitacionDifusionDocument.count(args),
      paginationDto,
      where,
      orderBy,
    );

    this.logger.log(`Capacitacion Difusion Documents found: ${result.pagination.total}`);
    return result;
  }

  async findById(id: string) {
    const doc = await this.prisma.artDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async delete(id: string, userId: string) {
    const doc = await this.findById(id);

    if (doc.url) {
      const filename = doc.url.split(`storage.googleapis.com/`)[1]?.split('/').slice(1).join('/');
      if (filename) await this.storageService.delete(filename).catch(() => {});
    }

    await this.prisma.artDocument.delete({ where: { id, createdBy: userId } });
    return { success: true };
  }

  async getSignedUrl(id: string, expiresInSeconds = 3600) {
    const doc = await this.findById(id);
    if (!doc.url) throw new NotFoundException('Document has no file');

    const filename = doc.url.split(`storage.googleapis.com/${envs.gcp.bucketName}/`)[1];
    const signedUrl = await this.storageService.getSignedUrl(filename, expiresInSeconds);
    return { url: signedUrl, expiresIn: expiresInSeconds };
  }

  async getCapacitacionDifusionSignedUrl(id: string, expiresInSeconds = 3600) {
    const doc = await this.prisma.capacitacionDifusionDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
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
