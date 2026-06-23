import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { GetUser } from 'src/main/decorators/get-user.decorator';
import { CreateArtDtoV2 } from './dtos/art-data-v2.dto';
import { RequirePermissions } from 'src/permissions/decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';
import { PaginatedQueryDto, PaginationDto } from 'src/common/dtos/filter.dto';
import { CreateCapacitacionDifusionDataDto } from './dtos/capacitacion-difusion-data.dto';
import { Public } from 'src/main/decorators/public.decorator';

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_ART_READ])
  @Get('art')
  findAllArtDocuments(@Query() query: PaginatedQueryDto) {
    this.logger.debug('Received request to find all art documents');
    const { page, pageSize, filterDto } = query;
    return this.documentsService.findAll({ page, pageSize }, filterDto);
  }

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_CAPACITACION_DIFUSION_READ])
  @Get('capacitacion-difusion')
  findAllCapacitacionDifusionDocuments(@Query() query: PaginatedQueryDto) {
    this.logger.debug('Received request to find all capacitacion difusion documents');
    const { page, pageSize, filterDto } = query;
    return this.documentsService.findAllCapacitacionDifusionDocuments({ page, pageSize }, filterDto);
  }

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_ART_CREATE])
  @Post('art')
  createArt(@Body() artData: CreateArtDtoV2, @GetUser('id') createdById: string) {
    this.logger.debug(`Creating ART by user ${createdById}`);
    return this.documentsService.createArt(createdById, artData);
  }

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_CAPACITACION_DIFUSION_CREATE])
  @Post('capacitacion-difusion')
  createCapacitacionDifusion(
    @Body() capacitacionDifusionData: CreateCapacitacionDifusionDataDto,
    @GetUser('id') createdById: string
  ) {
    this.logger.debug(`Creating ART by user ${createdById}`);
    return this.documentsService.createCapacitacionDifusion(createdById, capacitacionDifusionData);
  }

  // mis-documentos must be declared BEFORE :id to avoid route collision
  @Get('capacitacion-difusion/mis-documentos')
  getMisCapacitacionDocumentos(
    @GetUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.documentsService.findMisCapacitacionDocumentos(userId, paginationDto);
  }

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_ART_READ])
  @Get('capacitacion-difusion/:id/signed-url')
  getCapacitacionDifusionSignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    return this.documentsService.getCapacitacionDifusionSignedUrl(
      id,
      expiresIn ? parseInt(expiresIn, 10) : 3600,
    );
  }

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_CAPACITACION_DIFUSION_READ])
  @Get('capacitacion-difusion/:id')
  getCapacitacionDifusion(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.documentsService.findCapacitacionDifusionById(id, userId);
  }

  @Post('capacitacion-difusion/:id/firmar')
  firmarCapacitacionDifusion(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.documentsService.firmarCapacitacionDifusion(id, userId);
  }

  @Get('me/capacitacion-difusion/:id')
  getMyCapacitacionDifusion(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.documentsService.findMyCapacitacionDifusionById(id, userId);
  }

  @Post('me/capacitacion-difusion/:id/firmar')
  firmarMyCapacitacionDifusion(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.documentsService.firmarCapacitacionDifusion(id, userId);
  }

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_ART_READ])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_ART_READ])
  @Get('art/:id/signed-url')
  getSignedUrl(@Param('id') id: string, @Query('expiresIn') expiresIn?: string) {
    return this.documentsService.getSignedUrl(id, expiresIn ? parseInt(expiresIn, 10) : 3600);
  }
}
