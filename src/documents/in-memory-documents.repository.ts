import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  assertValidCompletionAnalysis,
  type CreateDocumentInput,
  type Document,
} from './document.js';
import { DocumentsRepository } from './documents.repository.js';

@Injectable()
export class InMemoryDocumentsRepository extends DocumentsRepository {
  private readonly documentsById = new Map<string, Document>();
  private readonly documentIdByStorageKey = new Map<string, string>();

  createProcessing(input: CreateDocumentInput): Document {
    if (this.documentIdByStorageKey.has(input.storageKey)) {
      throw new Error(`Duplicate document storageKey: ${input.storageKey}`);
    }

    if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
      throw new Error('Document sizeBytes must be a positive integer');
    }

    const now = new Date();
    const created: Document = {
      id: randomUUID(),
      userId: input.userId,
      title: input.title,
      instruction: input.instruction,
      originalName: input.originalName,
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: 'processing',
      analysis: null,
      failureCode: null,
      createdAt: now,
      updatedAt: now,
    };

    this.documentsById.set(created.id, created);
    this.documentIdByStorageKey.set(created.storageKey, created.id);
    return { ...created };
  }

  findByIdAndOwner(id: string, userId: string): Document | null {
    const document = this.documentsById.get(id);

    if (!document || document.userId !== userId) {
      return null;
    }

    return { ...document };
  }

  listByOwner(userId: string): Document[] {
    return [...this.documentsById.values()]
      .filter((document) => document.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((document) => ({ ...document }));
  }

  markCompleted(id: string, userId: string, analysis: string): Document | null {
    const existing = this.documentsById.get(id);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    const validAnalysis = assertValidCompletionAnalysis(analysis);
    const updated: Document = {
      ...existing,
      status: 'completed',
      analysis: validAnalysis,
      failureCode: null,
      updatedAt: new Date(),
    };

    this.documentsById.set(id, updated);
    return { ...updated };
  }

  markFailed(
    id: string,
    userId: string,
    failureCode: string | null,
  ): Document | null {
    const existing = this.documentsById.get(id);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    const updated: Document = {
      ...existing,
      status: 'failed',
      analysis: null,
      failureCode,
      updatedAt: new Date(),
    };

    this.documentsById.set(id, updated);
    return { ...updated };
  }

  deleteByIdAndOwner(id: string, userId: string): boolean {
    const existing = this.documentsById.get(id);

    if (!existing || existing.userId !== userId) {
      return false;
    }

    this.documentsById.delete(id);
    this.documentIdByStorageKey.delete(existing.storageKey);
    return true;
  }
}
