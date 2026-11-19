import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment.schema.js';
import { ExternalStorageUnavailableException } from './document-storage.service.js';
import {
  S3DocumentStorageService,
  type S3ClientLike,
} from './s3-document-storage.service.js';

describe('S3DocumentStorageService', () => {
  const send = vi.fn();
  const s3Client: S3ClientLike = { send };
  const config = new ConfigService<Environment, true>({
    NODE_ENV: 'development',
    PORT: 3000,
    FRONTEND_URL: 'http://localhost:5173',
    GOOGLE_CLIENT_ID: 'client-id',
    DATABASE_URL:
      'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital',
    AWS_REGION: 'sa-east-1',
    AWS_S3_BUCKET: 'jusdigital-private-bucket',
  });
  let logError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logError.mockRestore();
  });

  it('uploads an object with private attachment and AES256 settings', async () => {
    send.mockResolvedValueOnce({});
    const service = new S3DocumentStorageService(s3Client, config);
    const body = Buffer.from('%PDF-1.7 sample');

    await service.uploadObject({
      storageKey: 'users/user-1/documents/doc-1.pdf',
      body,
      contentType: 'application/pdf',
      originalName: 'contrato.pdf',
    });

    expect(send).toHaveBeenCalledTimes(1);
    const [command, options] = send.mock.calls[0] as [
      PutObjectCommand,
      { abortSignal: AbortSignal },
    ];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'jusdigital-private-bucket',
      Key: 'users/user-1/documents/doc-1.pdf',
      Body: body,
      ContentLength: body.byteLength,
      ContentType: 'application/pdf',
      ContentDisposition: 'attachment',
      ServerSideEncryption: 'AES256',
    });
    expect(options.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('reads and deletes objects from the configured bucket', async () => {
    const expectedBytes = Uint8Array.from(Buffer.from('Hello JusDigital'));
    send.mockResolvedValueOnce({
      Body: {
        transformToByteArray: vi.fn().mockResolvedValue(expectedBytes),
      },
    });
    send.mockResolvedValueOnce({});

    const service = new S3DocumentStorageService(s3Client, config);
    const content = await service.getObjectBytes(
      'users/user-1/documents/doc-1.txt',
    );
    expect(content.toString('utf8')).toBe('Hello JusDigital');
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand);

    await service.deleteObject('users/user-1/documents/doc-1.txt');
    expect(send.mock.calls[1]?.[0]).toBeInstanceOf(DeleteObjectCommand);
  });

  it('translates AWS SDK failures into ExternalStorageUnavailableException without leaking internals', async () => {
    send.mockRejectedValue(new Error('AccessDenied: secret details'));
    const service = new S3DocumentStorageService(s3Client, config);

    await expect(
      service.uploadObject({
        storageKey: 'users/user-1/documents/doc-1.pdf',
        body: Buffer.from('%PDF-1.7'),
        contentType: 'application/pdf',
        originalName: 'doc.pdf',
      }),
    ).rejects.toBeInstanceOf(ExternalStorageUnavailableException);

    await expect(
      service.getObjectBytes('users/user-1/documents/doc-1.pdf'),
    ).rejects.toBeInstanceOf(ExternalStorageUnavailableException);

    await expect(
      service.deleteObject('users/user-1/documents/doc-1.pdf'),
    ).rejects.toBeInstanceOf(ExternalStorageUnavailableException);

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 's3_document_storage_operation_failed',
        errorName: 'Error',
      }),
    );
    expect(JSON.stringify(logError.mock.calls)).not.toContain('secret details');
  });
});
