import type { CreateDocumentInput, DocumentRecord } from './documents.types.js';
import {
  DOCUMENT_API_TIMEOUT_MS,
  DOCUMENT_FORMATS_LABEL,
  DOCUMENT_LIMITS,
  SUPPORTED_DOCUMENT_EXTENSIONS,
} from './document.constants.js';
import { getFileExtension } from './document-formatters.js';

interface DocumentResponse {
  document: DocumentRecord;
}

interface DocumentsResponse {
  documents: DocumentRecord[];
}

interface ErrorResponse {
  code?: unknown;
  errorCode?: unknown;
  message?: unknown;
}

type FetchImplementation = typeof fetch;

const SUPPORTED_EXTENSIONS_SET = new Set<string>(SUPPORTED_DOCUMENT_EXTENSIONS);

export class DocumentHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    readonly details: string | null = null,
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

export function validateDocumentFile(
  file: Pick<File, 'name' | 'size'> | null | undefined,
): string | null {
  if (!file || file.name.trim().length === 0) {
    return 'Selecione um arquivo válido para enviar.';
  }

  const extension = getFileExtension(file.name.trim(), '');
  if (!SUPPORTED_EXTENSIONS_SET.has(extension)) {
    return `Formato de arquivo não suportado. Envie um arquivo ${DOCUMENT_FORMATS_LABEL}.`;
  }

  if (file.size <= 0) {
    return 'O arquivo selecionado está vazio. Escolha um documento com conteúdo.';
  }

  if (file.size > DOCUMENT_LIMITS.sizeBytes) {
    return `O arquivo excede o tamanho máximo de ${DOCUMENT_LIMITS.sizeMegabytes} MB.`;
  }

  return null;
}

export function validateDocumentFields(fields: {
  title: string;
  instruction: string;
}): string | null {
  const trimmedTitle = fields.title.trim();
  if (trimmedTitle.length === 0) {
    return 'O título do documento é obrigatório.';
  }
  if (trimmedTitle.length > DOCUMENT_LIMITS.titleLength) {
    return `O título deve ter no máximo ${DOCUMENT_LIMITS.titleLength} caracteres.`;
  }

  const trimmedInstruction = fields.instruction.trim();
  if (trimmedInstruction.length === 0) {
    return 'A instrução para a IA é obrigatória.';
  }
  if (trimmedInstruction.length > DOCUMENT_LIMITS.instructionLength) {
    return `A instrução deve ter no máximo ${DOCUMENT_LIMITS.instructionLength.toLocaleString('pt-BR')} caracteres.`;
  }

  return null;
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
          extractErrorDetails(body.message),
        );
      }

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractErrorDetails(message: unknown): string | null {
  if (typeof message === 'string' && message.trim().length > 0) {
    return message.trim();
  }

  if (Array.isArray(message)) {
    const parts = message
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : null;
  }

  return null;
}

export function toSafeDocumentError(
  error: unknown,
  fallback = 'Não foi possível salvar o documento. Tente novamente.',
): string {
  if (error instanceof DocumentHttpError) {
    if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
    if (error.code === 'INVALID_FILE') {
      return toInvalidFileMessage(error.details);
    }
    if (error.status === 400) {
      return toBadRequestMessage(error.details);
    }
    if (error.code === 'ANALYSIS_FAILED') {
      return toAnalysisFailedMessage(error.details);
    }
    if (error.code === 'EXTERNAL_SERVICE_UNAVAILABLE') {
      return toExternalServiceUnavailableMessage(error.details);
    }
    if (error.status >= 500) {
      return fallback;
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'A análise da IA excedeu o tempo limite. Tente novamente.';
  }

  return fallback;
}

function toAnalysisFailedMessage(details: string | null): string {
  const normalized = details?.toLowerCase() ?? '';

  if (normalized.includes('could not be read')) {
    return 'A IA não conseguiu ler o conteúdo deste arquivo. Verifique se o documento possui texto legível e tente novamente.';
  }

  return 'Não foi possível concluir a análise do documento pela IA. Tente novamente.';
}

function toExternalServiceUnavailableMessage(details: string | null): string {
  const normalized = details?.toLowerCase() ?? '';

  if (normalized.includes('timed out')) {
    return 'A análise da IA excedeu o tempo limite. Tente novamente.';
  }
  if (normalized.includes('rate limit')) {
    return 'O limite de uso da IA foi atingido no momento. Aguarde alguns instantes e tente novamente.';
  }

  return 'O serviço está temporariamente indisponível. Tente novamente em instantes.';
}

function toInvalidFileMessage(details: string | null): string {
  const normalized = details?.toLowerCase() ?? '';

  if (normalized.includes('unsupported document format')) {
    return `Formato de arquivo não suportado. Envie um arquivo ${DOCUMENT_FORMATS_LABEL}.`;
  }
  if (
    normalized.includes('exceeds the') ||
    normalized.includes('maximum size')
  ) {
    return `O arquivo excede o tamanho máximo de ${DOCUMENT_LIMITS.sizeMegabytes} MB.`;
  }
  if (normalized.includes('cannot be empty')) {
    return 'O arquivo selecionado está vazio. Escolha um documento com conteúdo.';
  }
  if (
    normalized.includes('file is required') ||
    normalized.includes('file name is required')
  ) {
    return 'Selecione um arquivo válido para enviar.';
  }
  if (normalized.includes('file content does not match')) {
    return 'O conteúdo do arquivo é inválido ou não corresponde ao formato informado.';
  }

  return `O arquivo não é válido. Confira o formato e o limite de ${DOCUMENT_LIMITS.sizeMegabytes} MB.`;
}

function toBadRequestMessage(details: string | null): string {
  const normalized = details?.toLowerCase() ?? '';

  if (normalized.includes('document title is required')) {
    return 'O título do documento é obrigatório.';
  }
  if (normalized.includes('document title must be at most')) {
    return `O título deve ter no máximo ${DOCUMENT_LIMITS.titleLength} caracteres.`;
  }
  if (normalized.includes('document instruction is required')) {
    return 'A instrução para a IA é obrigatória.';
  }
  if (normalized.includes('document instruction must be at most')) {
    return `A instrução deve ter no máximo ${DOCUMENT_LIMITS.instructionLength.toLocaleString('pt-BR')} caracteres.`;
  }

  return 'Revise o título, a instrução e o arquivo selecionado.';
}
