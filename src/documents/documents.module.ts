import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Environment } from '../config/environment.schema.js';
import { DocumentsRepository } from './documents.repository.js';
import { InMemoryDocumentsRepository } from './in-memory-documents.repository.js';
import { PostgresDocumentsRepository } from './postgres-documents.repository.js';

@Module({
  imports: [ConfigModule],
  providers: [
    InMemoryDocumentsRepository,
    PostgresDocumentsRepository,
    {
      provide: DocumentsRepository,
      inject: [
        ConfigService,
        InMemoryDocumentsRepository,
        PostgresDocumentsRepository,
      ],
      useFactory: (
        config: ConfigService<Environment, true>,
        inMemory: InMemoryDocumentsRepository,
        postgres: PostgresDocumentsRepository,
      ): DocumentsRepository =>
        config.get('NODE_ENV', { infer: true }) === 'test'
          ? inMemory
          : postgres,
    },
  ],
  exports: [
    DocumentsRepository,
    InMemoryDocumentsRepository,
    PostgresDocumentsRepository,
  ],
})
export class DocumentsModule {}
