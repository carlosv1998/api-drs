import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { envs } from 'src/config/envs';
import { IStorageService } from '../interfaces/storage.interface';

@Injectable()
export class GcpStorageService implements IStorageService {
  private readonly logger = new Logger(GcpStorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = envs.gcp.bucketName;
    this.storage = new Storage({
      projectId: envs.gcp.projectId,
      credentials: {
        client_email: envs.gcp.clientEmail,
        private_key: envs.gcp.privateKey,
      },
    });
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
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(filename)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      });
    return url;
  }
}
