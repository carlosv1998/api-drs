import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dtos/upload-document.dto';
import { UpdateDocumentDto } from './dtos/update-document.dto';
import { CreateArtDto } from './dtos/create-art.dto';
import { SignArtDto } from './dtos/sign-art.dto';
import { GetUser } from 'src/main/decorators/get-user.decorator';
import { ArtDataDto } from './dtos/art-data.dto';

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  // ── Generic upload ─────────────────────────────────────────────

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: UploadDocumentDto,
    @GetUser('id') userId: string,
  ) {
    return this.documentsService.uploadFile(file, userId, data);
  }

  // ── ART endpoints ──────────────────────────────────────────────

  @Post('art')
  createArt(@Body() dto: CreateArtDto, @GetUser('id') userId: string) {
    this.logger.debug(`Creating ART for user ${userId}`);
    return this.documentsService.createArt(userId, dto);
  }

  @Patch('art/:id/data')
  updateArtData(
    @Param('id') id: string,
    @Body() data: ArtDataDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.debug(`Updating ART data ${id}`);
    return this.documentsService.updateArtData(id, userId, data);
  }

  @Post('art/:id/sign')
  signArt(
    @Param('id') id: string,
    @Body() dto: SignArtDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.debug(`User ${userId} signing ART ${id}`);
    return this.documentsService.signArt(id, userId, dto);
  }

  // ── Shared ─────────────────────────────────────────────────────

  @Get()
  findAll(@GetUser('id') userId: string) {
    return this.documentsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Get(':id/signed-url')
  getSignedUrl(@Param('id') id: string, @Query('expiresIn') expiresIn?: string) {
    return this.documentsService.getSignedUrl(id, expiresIn ? parseInt(expiresIn, 10) : 3600);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() data: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, userId, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.documentsService.delete(id, userId);
  }
}
