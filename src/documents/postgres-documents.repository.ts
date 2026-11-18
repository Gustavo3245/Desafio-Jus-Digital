import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../database/database.constants.js';
import { documentsTable } from '../database/schema.js';
import {
  assertValidCompletionAnalysis,
  type CreateDocumentInput,
  type Document,
} from './document.js';
import { DocumentsRepository } from './documents.repository.js';

@Injectable()
export class PostgresDocumentsRepository extends DocumentsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {
    super();
  }

  async createProcessing(input: CreateDocumentInput): Promise<Document> {
    if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
      throw new Error('Document sizeBytes must be a positive integer');
    }

    const now = new Date();
    const [created] = await this.db
      .insert(documentsTable)
      .values({
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
      })
      .returning();

    return created;
  }

  async findByIdAndOwner(id: string, userId: string): Promise<Document | null> {
    const [row] = await this.db
      .select()
      .from(documentsTable)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)))
      .limit(1);

    return row ?? null;
  }

  async listByOwner(userId: string): Promise<Document[]> {
    return this.db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.userId, userId))
      .orderBy(desc(documentsTable.createdAt));
  }

  async markCompleted(
    id: string,
    userId: string,
    analysis: string,
  ): Promise<Document | null> {
    const validAnalysis = assertValidCompletionAnalysis(analysis);
    const [updated] = await this.db
      .update(documentsTable)
      .set({
        status: 'completed',
        analysis: validAnalysis,
        failureCode: null,
        updatedAt: new Date(),
      })
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)))
      .returning();

    return updated ?? null;
  }

  async markFailed(
    id: string,
    userId: string,
    failureCode: string | null,
  ): Promise<Document | null> {
    const [updated] = await this.db
      .update(documentsTable)
      .set({
        status: 'failed',
        analysis: null,
        failureCode,
        updatedAt: new Date(),
      })
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)))
      .returning();

    return updated ?? null;
  }

  async deleteByIdAndOwner(id: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(documentsTable)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)))
      .returning({ id: documentsTable.id });

    return deleted.length > 0;
  }
}
