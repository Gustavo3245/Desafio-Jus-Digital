import { describe, expect, it, vi } from 'vitest';
import { DOCUMENT_LIMITS } from './document.constants.js';
import {
  createDocumentsApi,
  DocumentHttpError,
  toSafeDocumentError,
  validateDocumentFields,
  validateDocumentFile,
} from './documents-api.js';
import type { DocumentRecord } from './documents.types.js';

const documentRecord: DocumentRecord = {
  id: 'document-1',
  title: 'Contrato',
  instruction: 'Resuma o documento',
  originalName: 'contrato.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 8,
  status: 'completed',
  analysis: 'Resumo',
  failureCode: null,
  createdAt: '2026-11-19T12:00:00.000Z',
  updatedAt: '2026-11-19T12:00:01.000Z',
};

describe('createDocumentsApi', () => {
  it('submits the document fields with credentials', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ document: documentRecord }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const api = createDocumentsApi(
      'http://localhost:3000/api/v1/',
      fetchImplementation,
    );
    const file = new File(['%PDF-1.7'], 'contrato.pdf', {
      type: 'application/pdf',
    });

    await expect(
      api.createDocument({
        file,
        title: '  Contrato  ',
        instruction: '  Resuma o documento  ',
      }),
    ).resolves.toEqual(documentRecord);

    const [url, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(url).toBe('http://localhost:3000/api/v1/documents');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(init?.body).toBeInstanceOf(FormData);
    const form = init?.body as FormData;
    expect(form.get('file')).toBe(file);
    expect(form.get('title')).toBe('Contrato');
    expect(form.get('instruction')).toBe('Resuma o documento');
  });

  it('exposes specific error messages for invalid file and field errors', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'INVALID_FILE',
          message:
            'Unsupported document format; allowed formats are PDF, DOCX, DOC and TXT',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    const api = createDocumentsApi('http://api.test', fetchImplementation);

    await expect(
      api.createDocument({
        file: new File(['bad'], 'imagem.png'),
        title: 'Arquivo',
        instruction: 'Analise',
      }),
    ).rejects.toEqual(
      new DocumentHttpError(
        400,
        'INVALID_FILE',
        'Unsupported document format; allowed formats are PDF, DOCX, DOC and TXT',
      ),
    );

    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          400,
          'INVALID_FILE',
          'Unsupported document format; allowed formats are PDF, DOCX, DOC and TXT',
        ),
      ),
    ).toBe(
      'Formato de arquivo não suportado. Envie um arquivo PDF, DOC, DOCX ou TXT.',
    );
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          400,
          'INVALID_FILE',
          'Document file exceeds the 10 MB maximum size',
        ),
      ),
    ).toBe('O arquivo excede o tamanho máximo de 10 MB.');
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          400,
          'INVALID_FILE',
          'Document file cannot be empty',
        ),
      ),
    ).toBe(
      'O arquivo selecionado está vazio. Escolha um documento com conteúdo.',
    );
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          400,
          'INVALID_FILE',
          'File content does not match a valid PDF document',
        ),
      ),
    ).toBe(
      'O conteúdo do arquivo é inválido ou não corresponde ao formato informado.',
    );
    expect(
      toSafeDocumentError(new DocumentHttpError(400, 'INVALID_FILE')),
    ).toBe('O arquivo não é válido. Confira o formato e o limite de 10 MB.');
    expect(
      toSafeDocumentError(
        new DocumentHttpError(400, null, 'title: Document title is required'),
      ),
    ).toBe('O título do documento é obrigatório.');
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          400,
          null,
          'title: Document title must be at most 150 characters',
        ),
      ),
    ).toBe('O título deve ter no máximo 150 caracteres.');
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          400,
          null,
          'instruction: Document instruction is required',
        ),
      ),
    ).toBe('A instrução para a IA é obrigatória.');
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          400,
          null,
          'instruction: Document instruction must be at most 2000 characters',
        ),
      ),
    ).toBe('A instrução deve ter no máximo 2.000 caracteres.');
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          503,
          'EXTERNAL_SERVICE_UNAVAILABLE',
          'Document analysis timed out',
        ),
      ),
    ).toBe('A análise da IA excedeu o tempo limite. Tente novamente.');
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          503,
          'EXTERNAL_SERVICE_UNAVAILABLE',
          'Document analysis rate limit reached',
        ),
      ),
    ).toBe(
      'O limite de uso da IA foi atingido no momento. Aguarde alguns instantes e tente novamente.',
    );
    expect(
      toSafeDocumentError(
        new DocumentHttpError(
          502,
          'ANALYSIS_FAILED',
          'Document content could not be read for analysis',
        ),
      ),
    ).toBe(
      'A IA não conseguiu ler o conteúdo deste arquivo. Verifique se o documento possui texto legível e tente novamente.',
    );
  });

  it('validates file extension, empty size and 10 MB limit on the client', () => {
    expect(
      validateDocumentFile({ name: 'contrato.pdf', size: 1_024 }),
    ).toBeNull();
    expect(
      validateDocumentFile({ name: 'minuta.DOCX', size: 2_048 }),
    ).toBeNull();
    expect(validateDocumentFile({ name: 'laudo.doc', size: 512 })).toBeNull();
    expect(validateDocumentFile({ name: 'notas.txt', size: 128 })).toBeNull();

    expect(validateDocumentFile({ name: 'foto.png', size: 1_024 })).toBe(
      'Formato de arquivo não suportado. Envie um arquivo PDF, DOC, DOCX ou TXT.',
    );
    expect(validateDocumentFile({ name: 'sem-extensao', size: 1_024 })).toBe(
      'Formato de arquivo não suportado. Envie um arquivo PDF, DOC, DOCX ou TXT.',
    );
    expect(validateDocumentFile({ name: 'vazio.pdf', size: 0 })).toBe(
      'O arquivo selecionado está vazio. Escolha um documento com conteúdo.',
    );
    expect(
      validateDocumentFile({
        name: 'grande.pdf',
        size: DOCUMENT_LIMITS.sizeBytes + 1,
      }),
    ).toBe('O arquivo excede o tamanho máximo de 10 MB.');
  });

  it('validates required fields and character limits for title and instruction', () => {
    expect(
      validateDocumentFields({
        title: 'Contrato Social',
        instruction: 'Resuma as cláusulas principais',
      }),
    ).toBeNull();

    expect(
      validateDocumentFields({
        title: '   ',
        instruction: 'Resuma',
      }),
    ).toBe('O título do documento é obrigatório.');

    expect(
      validateDocumentFields({
        title: 'A'.repeat(DOCUMENT_LIMITS.titleLength + 1),
        instruction: 'Resuma',
      }),
    ).toBe('O título deve ter no máximo 150 caracteres.');

    expect(
      validateDocumentFields({
        title: 'Contrato',
        instruction: '   ',
      }),
    ).toBe('A instrução para a IA é obrigatória.');

    expect(
      validateDocumentFields({
        title: 'Contrato',
        instruction: 'I'.repeat(DOCUMENT_LIMITS.instructionLength + 1),
      }),
    ).toBe('A instrução deve ter no máximo 2.000 caracteres.');
  });

  it('lists and reads persisted documents with the authenticated session', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ documents: [documentRecord] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ document: documentRecord }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const api = createDocumentsApi(
      'http://api.test/api/v1',
      fetchImplementation,
    );

    await expect(api.listDocuments()).resolves.toEqual([documentRecord]);
    await expect(api.getDocument('document/1')).resolves.toEqual(
      documentRecord,
    );

    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      'http://api.test/api/v1/documents',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      'http://api.test/api/v1/documents/document%2F1',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('deletes one document without attempting to parse the empty response', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const api = createDocumentsApi(
      'http://api.test/api/v1',
      fetchImplementation,
    );

    await expect(api.deleteDocument('document-1')).resolves.toBeUndefined();

    expect(fetchImplementation).toHaveBeenCalledWith(
      'http://api.test/api/v1/documents/document-1',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    );
  });
});
