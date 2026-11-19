import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment.schema.js';
import {
  DocumentStorageService,
  ExternalStorageUnavailableException,
  type UploadDocumentObjectInput,
} from './document-storage.service.js';

export const S3_CLIENT = Symbol('S3_CLIENT');
const DEFAULT_S3_TIMEOUT_MS = 15_000;

export type S3ClientLike = Pick<S3Client, 'send'>;

@Injectable()
export class S3DocumentStorageService extends DocumentStorageService {
  private readonly logger = new Logger(S3DocumentStorageService.name);
  private readonly bucket: string;

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3ClientLike,
    config: ConfigService<Environment, true>,
  ) {
    super();
    this.bucket = config.get('AWS_S3_BUCKET', { infer: true });
  }

  async uploadObject(input: UploadDocumentObjectInput): Promise<void> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: input.storageKey,
          Body: input.body,
          ContentLength: input.body.byteLength,
          ContentType: input.contentType,
          ContentDisposition: 'attachment',
          ServerSideEncryption: 'AES256',
        }),
        { abortSignal: AbortSignal.timeout(DEFAULT_S3_TIMEOUT_MS) },
      );
    } catch (error) {
      this.logFailure('put_object', error);
      throw new ExternalStorageUnavailableException();
    }
  }

  async getObjectBytes(storageKey: string): Promise<Buffer> {
    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
        { abortSignal: AbortSignal.timeout(DEFAULT_S3_TIMEOUT_MS) },
      );

      if (!response.Body) {
        throw new ExternalStorageUnavailableException();
      }

      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      this.logFailure('get_object', error);

      if (error instanceof ExternalStorageUnavailableException) {
        throw error;
      }

      throw new ExternalStorageUnavailableException();
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
        { abortSignal: AbortSignal.timeout(DEFAULT_S3_TIMEOUT_MS) },
      );
    } catch (error) {
      this.logFailure('delete_object', error);
      throw new ExternalStorageUnavailableException();
    }
  }

  private logFailure(operation: string, error: unknown): void {
    const sdkError = isRecord(error) ? error : {};
    const metadata = isRecord(sdkError.$metadata) ? sdkError.$metadata : {};

    this.logger.error({
      event: 's3_document_storage_operation_failed',
      operation,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorCode:
        typeof sdkError.Code === 'string'
          ? sdkError.Code
          : typeof sdkError.code === 'string'
            ? sdkError.code
            : undefined,
      httpStatusCode:
        typeof metadata.httpStatusCode === 'number'
          ? metadata.httpStatusCode
          : undefined,
      requestId:
        typeof metadata.requestId === 'string' ? metadata.requestId : undefined,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
