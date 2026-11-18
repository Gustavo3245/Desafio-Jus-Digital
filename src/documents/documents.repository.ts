import type { CreateDocumentInput, Document } from './document.js';

export abstract class DocumentsRepository {
  abstract createProcessing(
    input: CreateDocumentInput,
  ): Document | Promise<Document>;

  abstract findByIdAndOwner(
    id: string,
    userId: string,
  ): Document | null | Promise<Document | null>;

  abstract listByOwner(userId: string): Document[] | Promise<Document[]>;

  abstract markCompleted(
    id: string,
    userId: string,
    analysis: string,
  ): Document | null | Promise<Document | null>;

  abstract markFailed(
    id: string,
    userId: string,
    failureCode: string | null,
  ): Document | null | Promise<Document | null>;

  abstract deleteByIdAndOwner(
    id: string,
    userId: string,
  ): boolean | Promise<boolean>;
}
