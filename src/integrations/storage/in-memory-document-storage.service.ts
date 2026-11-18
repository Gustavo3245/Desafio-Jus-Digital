import { Injectable } from '@nestjs/common';
import {
  DocumentStorageService,
  ExternalStorageUnavailableException,
  type UploadDocumentObjectInput,
} from './document-storage.service.js';

export interface StoredDocumentObject {
  storageKey: string;
  body: Buffer;
  contentType: string;
  originalName: string;
}

@Injectable()
export class InMemoryDocumentStorageService extends DocumentStorageService {
  private readonly objects = new Map<string, StoredDocumentObject>();

  async uploadObject(input: UploadDocumentObjectInput): Promise<void> {
    this.objects.set(input.storageKey, {
      storageKey: input.storageKey,
      body: Buffer.from(input.body),
      contentType: input.contentType,
      originalName: input.originalName,
    });
  }

  async getObjectBytes(storageKey: string): Promise<Buffer> {
    const stored = this.objects.get(storageKey);

    if (!stored) {
      throw new ExternalStorageUnavailableException(
        'Stored document object was not found',
      );
    }

    return Buffer.from(stored.body);
  }

  async deleteObject(storageKey: string): Promise<void> {
    this.objects.delete(storageKey);
  }

  hasObject(storageKey: string): boolean {
    return this.objects.has(storageKey);
  }
}
