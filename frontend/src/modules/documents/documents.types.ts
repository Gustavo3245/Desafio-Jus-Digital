export interface DocumentRecord {
  id: string;
  title: string;
  instruction: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'processing' | 'completed' | 'failed';
  analysis: string | null;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  file: File;
  title: string;
  instruction: string;
}
