export type DocumentStatus = 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  userId: string;
  title: string;
  instruction: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  analysis: string | null;
  failureCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentInput {
  userId: string;
  title: string;
  instruction: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export function assertValidCompletionAnalysis(analysis: string): string {
  const normalized = analysis.trim();

  if (normalized.length === 0) {
    throw new Error('Completed document requires a non-empty analysis');
  }

  return normalized;
}
