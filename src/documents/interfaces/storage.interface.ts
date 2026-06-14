export interface IStorageService {
  upload(buffer: Buffer, filename: string, mimetype: string): Promise<string>;
  delete(filename: string): Promise<void>;
  getSignedUrl(filename: string, expiresInSeconds: number): Promise<string>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
