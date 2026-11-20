import type { CreateDocumentInput, DocumentRecord } from './documents.types.js';
import {
  DOCUMENT_API_TIMEOUT_MS,
  DOCUMENT_LIMITS,
} from './document.constants.js';

interface DocumentResponse {
  document: DocumentRecord;
}

interface DocumentsResponse {
  documents: DocumentRecord[];
}

interface ErrorResponse {
  code?: unknown;
  errorCode?: unknown;
}

type FetchImplementation = typeof fetch;

export class DocumentHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
  ) {
    super(`Document request failed with status ${status}`);
    this.name = 'DocumentHttpError';
  }
}

export interface DocumentsApi {
  createDocument(input: CreateDocumentInput): Promise<DocumentRecord>;
  listDocuments(): Promise<DocumentRecord[]>;
  getDocument(documentId: string): Promise<DocumentRecord>;
  deleteDocument(documentId: string): Promise<void>;
}

export function createDocumentsApi(
  baseUrl: string,
  fetchImplementation: FetchImplementation = fetch,
  timeoutMs = DOCUMENT_API_TIMEOUT_MS,
): DocumentsApi {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    async createDocument(input) {
      const form = new FormData();
      form.set('file', input.file);
      form.set('title', input.title.trim());
      form.set('instruction', input.instruction.trim());

      const response = await request('/documents', {
        method: 'POST',
        body: form,
      });
      const body = (await response.json()) as DocumentResponse;
      return body.document;
    },
    async listDocuments() {
      const response = await request('/documents', { method: 'GET' });
      const body = (await response.json()) as DocumentsResponse;
      return body.documents;
    },
    async getDocument(documentId) {
      const response = await request(
        `/documents/${encodeURIComponent(documentId)}`,
        { method: 'GET' },
      );
      const body = (await response.json()) as DocumentResponse;
      return body.document;
    },
    async deleteDocument(documentId) {
      await request(`/documents/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
      });
    },
  };

  async function request(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');

    try {
      const response = await fetchImplementation(
        `${normalizedBaseUrl}${path}`,
        {
          ...init,
          credentials: 'include',
          headers,
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ErrorResponse;
        const rawCode = body.code ?? body.errorCode;
        throw new DocumentHttpError(
          response.status,
          typeof rawCode === 'string' ? rawCode : null,
        );
      }

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function toSafeDocumentError(
  error: unknown,
  fallback = 'Não foi possível salvar o documento. Tente novamente.',
): string {
  if (error instanceof DocumentHttpError) {
    if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
    if (error.code === 'INVALID_FILE') {
      return `O arquivo não é válido. Confira o formato e o limite de ${DOCUMENT_LIMITS.sizeMegabytes} MB.`;
    }
    if (error.status === 400) {
      return 'Revise o título, a instrução e o arquivo selecionado.';
    }
    if (error.status >= 500) {
      return fallback;
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'A análise demorou mais que o esperado. Tente novamente.';
  }

  return fallback;
}
