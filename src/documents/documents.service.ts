import { Injectable } from '@nestjs/common';
import { DocumentStorageService } from '../integrations/storage/document-storage.service.js';
import {
  buildDocumentStorageKey,
  inspectAndValidateDocumentFile,
  type UploadedDocumentFileInput,
} from './document-file-validator.js';
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
  ) {}

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

    try {
      return await this.documents.createProcessing({
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
  }
}
