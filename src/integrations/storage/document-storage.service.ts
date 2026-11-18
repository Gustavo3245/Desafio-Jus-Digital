import { HttpException, HttpStatus } from '@nestjs/common';

export interface UploadDocumentObjectInput {
  storageKey: string;
  body: Buffer;
  contentType: string;
  originalName: string;
}

export class ExternalStorageUnavailableException extends HttpException {
  constructor(message = 'Document storage service is temporarily unavailable') {
    super(
      {
        code: 'EXTERNAL_SERVICE_UNAVAILABLE',
        message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export abstract class DocumentStorageService {
  abstract uploadObject(input: UploadDocumentObjectInput): Promise<void>;
  abstract getObjectBytes(storageKey: string): Promise<Buffer>;
  abstract deleteObject(storageKey: string): Promise<void>;
}
