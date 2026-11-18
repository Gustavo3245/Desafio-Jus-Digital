import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment.schema.js';
import { DocumentStorageService } from './document-storage.service.js';
import { InMemoryDocumentStorageService } from './in-memory-document-storage.service.js';
import {
  S3_CLIENT,
  S3DocumentStorageService,
} from './s3-document-storage.service.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>): S3Client => {
        const region = config.get('AWS_REGION', { infer: true });
        const endpoint = config.get('AWS_S3_ENDPOINT', { infer: true });
        const accessKeyId = config.get('AWS_ACCESS_KEY_ID', { infer: true });
        const secretAccessKey = config.get('AWS_SECRET_ACCESS_KEY', {
          infer: true,
        });

        return new S3Client({
          region,
          ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
          ...(accessKeyId && secretAccessKey
            ? {
                credentials: {
                  accessKeyId,
                  secretAccessKey,
                },
              }
            : {}),
        });
      },
    },
    InMemoryDocumentStorageService,
    S3DocumentStorageService,
    {
      provide: DocumentStorageService,
      inject: [
        ConfigService,
        InMemoryDocumentStorageService,
        S3DocumentStorageService,
      ],
      useFactory: (
        config: ConfigService<Environment, true>,
        inMemory: InMemoryDocumentStorageService,
        s3: S3DocumentStorageService,
      ): DocumentStorageService =>
        config.get('NODE_ENV', { infer: true }) === 'test' ? inMemory : s3,
    },
  ],
  exports: [
    DocumentStorageService,
    InMemoryDocumentStorageService,
    S3DocumentStorageService,
  ],
})
export class StorageModule {}
