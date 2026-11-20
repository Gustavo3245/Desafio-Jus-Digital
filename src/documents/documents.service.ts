import { Injectable } from '@nestjs/common';
import {
  DocumentAnalysisService,
  ExternalAnalysisUnavailableException,
  InvalidAnalysisResponseException,
} from '../integrations/openai/document-analysis.service.js';
import { DocumentStorageService } from '../integrations/storage/document-storage.service.js';
import {
  buildDocumentStorageKey,
  inspectAndValidateDocumentFile,
  type UploadedDocumentFileInput,
} from './document-file-validator.js';
import { DocumentNotFoundException } from './document-not-found.exception.js';
import type { Document } from './document.js';
import { DocumentsRepository } from './documents.repository.js';

export interface UploadDocumentCommand {
  userId: string;
  title: string;
  instruction: string;
  file: UploadedDocumentFileInput | undefined;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documents: DocumentsRepository,
    private readonly storage: DocumentStorageService,
    private readonly analysis: DocumentAnalysisService,
  ) {}

  async listDocuments(userId: string): Promise<Document[]> {
    return this.documents.listByOwner(userId);
  }

  async getDocument(userId: string, documentId: string): Promise<Document> {
    const document = await this.documents.findByIdAndOwner(documentId, userId);

    if (!document) {
      throw new DocumentNotFoundException();
    }

    return document;
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const document = await this.documents.findByIdAndOwner(documentId, userId);

    if (!document) {
      throw new DocumentNotFoundException();
    }

    await this.storage.deleteObject(document.storageKey);

    const deleted = await this.documents.deleteByIdAndOwner(documentId, userId);

    if (!deleted) {
      throw new DocumentNotFoundException();
    }
  }

  async createDocument(command: UploadDocumentCommand): Promise<Document> {
    const validatedFile = inspectAndValidateDocumentFile(command.file);
    const storageKey = buildDocumentStorageKey(
      command.userId,
      validatedFile.extension,
    );

    await this.storage.uploadObject({
      storageKey,
      body: validatedFile.buffer,
      contentType: validatedFile.mimeType,
      originalName: validatedFile.originalName,
    });

    let processingDocument: Document;

    try {
      processingDocument = await this.documents.createProcessing({
        userId: command.userId,
        title: command.title,
        instruction: command.instruction,
        originalName: validatedFile.originalName,
        storageKey,
        mimeType: validatedFile.mimeType,
        sizeBytes: validatedFile.sizeBytes,
      });
    } catch (error) {
      await this.storage.deleteObject(storageKey).catch(() => undefined);
      throw error;
    }

    try {
      const analysis = await this.analysis.analyzeDocument({
        body: validatedFile.buffer,
        originalName: validatedFile.originalName,
        mimeType: validatedFile.mimeType,
        instruction: command.instruction,
      });
      const completed = await this.documents.markCompleted(
        processingDocument.id,
        command.userId,
        analysis,
      );

      if (!completed) {
        throw new Error('Document could not transition to completed');
      }

      return completed;
    } catch (error) {
      await Promise.resolve(
        this.documents.markFailed(
          processingDocument.id,
          command.userId,
          toAnalysisFailureCode(error),
        ),
      ).catch(() => undefined);
      throw error;
    }
  }
}

function toAnalysisFailureCode(error: unknown): string {
  if (error instanceof InvalidAnalysisResponseException) {
    return error.failureCode;
  }

  if (error instanceof ExternalAnalysisUnavailableException) {
    return error.failureCode;
  }

  return 'ANALYSIS_PERSISTENCE_FAILED';
}
