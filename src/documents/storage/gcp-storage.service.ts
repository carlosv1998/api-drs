import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import { IStorageService } from '../interfaces/storage.interface';
import { envs } from 'src/config/envs';

@Injectable()
export class GcpStorageService implements IStorageService {
  private readonly logger = new Logger(GcpStorageService.name);
  private readonly storage: Storage;
  private readonly signingStorage: Storage;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = envs.gcp.bucketName;

    if (process.env.GOOGLE_JSON_CREDENTIALS) {
      const credentials = JSON.parse(process.env.GOOGLE_JSON_CREDENTIALS);
      // ADC para uploads/deletes — usa metadata server de Cloud Run, sin llamadas a oauth2.googleapis.com
      this.storage = new Storage({ projectId: credentials.project_id });
      // Credenciales explícitas solo para signing — firma localmente con la private key, sin llamadas HTTP
      this.signingStorage = new Storage({ credentials, projectId: credentials.project_id });
    } else {
      const keyFilename = join(process.cwd(), 'google-service-account.json');
      this.storage = new Storage({ keyFilename });
      this.signingStorage = new Storage({ keyFilename });
    }
  }

  async upload(buffer: Buffer, filename: string, mimetype: string, bucketName?: string): Promise<string> {
    const bucket = bucketName ?? this.bucketName;
    const file = this.storage.bucket(bucket).file(filename);
    await file.save(buffer, { contentType: mimetype, resumable: false });
    return `https://storage.googleapis.com/${bucket}/${filename}`;
  }

  async delete(filename: string, bucketName?: string): Promise<void> {
    const bucket = bucketName ?? this.bucketName;
    await this.storage.bucket(bucket).file(filename).delete({ ignoreNotFound: true });
  }

  async getSignedUrl(filename: string, expiresInSeconds: number): Promise<string> {
    const [url] = await this.signingStorage
      .bucket(this.bucketName)
      .file(filename)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      });
    return url;
  }
}
