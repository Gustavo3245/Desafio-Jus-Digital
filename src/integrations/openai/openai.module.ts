import OpenAI from 'openai';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment.schema.js';
import { DocumentAnalysisService } from './document-analysis.service.js';
import { InMemoryDocumentAnalysisService } from './in-memory-document-analysis.service.js';
import {
  OPENAI_CLIENT,
  OpenAIDocumentAnalysisService,
  type OpenAIResponsesClient,
} from './openai-document-analysis.service.js';

const OPENAI_TIMEOUT_MS = 60_000;

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: OPENAI_CLIENT,
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<Environment, true>,
      ): OpenAIResponsesClient =>
        new OpenAI({
          apiKey: config.get('OPENAI_API_KEY', { infer: true }),
          timeout: OPENAI_TIMEOUT_MS,
          maxRetries: 1,
        }),
    },
    InMemoryDocumentAnalysisService,
    OpenAIDocumentAnalysisService,
    {
      provide: DocumentAnalysisService,
      inject: [
        ConfigService,
        InMemoryDocumentAnalysisService,
        OpenAIDocumentAnalysisService,
      ],
      useFactory: (
        config: ConfigService<Environment, true>,
        inMemory: InMemoryDocumentAnalysisService,
        openai: OpenAIDocumentAnalysisService,
      ): DocumentAnalysisService =>
        config.get('NODE_ENV', { infer: true }) === 'test' ? inMemory : openai,
    },
  ],
  exports: [
    DocumentAnalysisService,
    InMemoryDocumentAnalysisService,
    OpenAIDocumentAnalysisService,
  ],
})
export class OpenAIModule {}
