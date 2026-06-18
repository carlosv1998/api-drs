import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { GcpStorageService } from './storage/gcp-storage.service';
import { PdfService } from './pdf/pdf.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, GcpStorageService, PdfService],
  exports: [DocumentsService, GcpStorageService],
})
export class DocumentsModule {}
