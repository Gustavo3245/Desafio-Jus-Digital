import type { CreateDocumentInput, DocumentRecord } from './documents.types.js';

interface DocumentResponse {
  document: DocumentRecord;
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
}

export function createDocumentsApi(
  baseUrl: string,
  fetchImplementation: FetchImplementation = fetch,
  timeoutMs = 120_000,
): DocumentsApi {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    async createDocument(input) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const form = new FormData();
      form.set('file', input.file);
      form.set('title', input.title.trim());
      form.set('instruction', input.instruction.trim());

      try {
        const response = await fetchImplementation(
          `${normalizedBaseUrl}/documents`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { Accept: 'application/json' },
            body: form,
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const body = (await response
            .json()
            .catch(() => ({}))) as ErrorResponse;
          const rawCode = body.code ?? body.errorCode;
          throw new DocumentHttpError(
            response.status,
            typeof rawCode === 'string' ? rawCode : null,
          );
        }

        const body = (await response.json()) as DocumentResponse;
        return body.document;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export function toSafeDocumentError(error: unknown): string {
  if (error instanceof DocumentHttpError) {
    if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
    if (error.code === 'INVALID_FILE') {
      return 'O arquivo não é válido. Confira o formato e o limite de 10 MB.';
    }
    if (error.status === 400) {
      return 'Revise o título, a instrução e o arquivo selecionado.';
    }
    if (error.status >= 500) {
      return 'Não foi possível analisar o documento agora. Tente novamente.';
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'A análise demorou mais que o esperado. Tente novamente.';
  }

  return 'Não foi possível salvar o documento. Tente novamente.';
}
