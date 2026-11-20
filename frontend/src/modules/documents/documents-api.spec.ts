import { describe, expect, it, vi } from 'vitest';
import {
  createDocumentsApi,
  DocumentHttpError,
  toSafeDocumentError,
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

  it('exposes a safe error category without leaking the response', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: 'INVALID_FILE' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const api = createDocumentsApi('http://api.test', fetchImplementation);

    await expect(
      api.createDocument({
        file: new File(['bad'], 'arquivo.pdf'),
        title: 'Arquivo',
        instruction: 'Analise',
      }),
    ).rejects.toEqual(new DocumentHttpError(400, 'INVALID_FILE'));
    expect(
      toSafeDocumentError(new DocumentHttpError(400, 'INVALID_FILE')),
    ).toBe('O arquivo não é válido. Confira o formato e o limite de 10 MB.');
  });
});
