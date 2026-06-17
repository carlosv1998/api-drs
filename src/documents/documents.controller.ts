import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dtos/upload-document.dto';
import { GetUser } from 'src/main/decorators/get-user.decorator';
import { CreateArtDtoV2 } from './dtos/art-data-v2.dto';
import { RequirePermissions } from 'src/permissions/decorators/require-permissions.decorator';
import { SCOPE_NAME } from 'src/common/enums/scopes.enum';
import { PaginatedQueryDto } from 'src/common/dtos/filter.dto';

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @RequirePermissions([SCOPE_NAME.DOCUMENTS_ART_READ])
  @Get()
  findAll(@Query() query: PaginatedQueryDto) {
    this.logger.debug('Received request to find all documents');
    const { page, pageSize, filterDto } = query;
    return this.documentsService.findAll({ page, pageSize }, filterDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: UploadDocumentDto,
    @GetUser('id') userId: string,
  ) {
    return this.documentsService.uploadFile(file, userId, data);
  }

  @Post('art')
  createArt(@Body() artData: CreateArtDtoV2, @GetUser('id') createdById: string) {
    this.logger.debug(`Creating ART by user ${createdById}`);
    return this.documentsService.createArt(createdById, artData);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Get(':id/signed-url')
  getSignedUrl(@Param('id') id: string, @Query('expiresIn') expiresIn?: string) {
    return this.documentsService.getSignedUrl(id, expiresIn ? parseInt(expiresIn, 10) : 3600);
  }
}
