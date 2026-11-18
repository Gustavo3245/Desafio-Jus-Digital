import { InMemoryDocumentsRepository } from './in-memory-documents.repository.js';

describe('InMemoryDocumentsRepository', () => {
  it('creates a processing document and transitions it to completed', () => {
    const repository = new InMemoryDocumentsRepository();

    const created = repository.createProcessing({
      userId: 'user-1',
      title: 'Contrato de prestação de serviços',
      instruction: 'Resuma as cláusulas de rescisão',
      originalName: 'contrato.pdf',
      storageKey: 'users/user-1/documents/doc-1.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4_096,
    });

    expect(created).toMatchObject({
      userId: 'user-1',
      status: 'processing',
      analysis: null,
      failureCode: null,
    });

    const completed = repository.markCompleted(
      created.id,
      'user-1',
      'Resumo jurídico gerado pela IA.',
    );

    expect(completed).toMatchObject({
      id: created.id,
      status: 'completed',
      analysis: 'Resumo jurídico gerado pela IA.',
      failureCode: null,
    });
  });

  it('transitions a processing document to failed and clears analysis', () => {
    const repository = new InMemoryDocumentsRepository();

    const created = repository.createProcessing({
      userId: 'user-1',
      title: 'Petição inicial',
      instruction: 'Identifique os pedidos principais',
      originalName: 'peticao.pdf',
      storageKey: 'users/user-1/documents/doc-2.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2_048,
    });

    const failed = repository.markFailed(
      created.id,
      'user-1',
      'OPENAI_TIMEOUT',
    );

    expect(failed).toMatchObject({
      id: created.id,
      status: 'failed',
      analysis: null,
      failureCode: 'OPENAI_TIMEOUT',
    });
  });

  it('enforces owner isolation for reads, status updates and deletion', () => {
    const repository = new InMemoryDocumentsRepository();

    const ownerDoc = repository.createProcessing({
      userId: 'owner-user',
      title: 'Parecer confidencial',
      instruction: 'Analise riscos',
      originalName: 'parecer.pdf',
      storageKey: 'users/owner-user/documents/doc-1.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1_024,
    });

    expect(repository.findByIdAndOwner(ownerDoc.id, 'other-user')).toBeNull();
    expect(repository.listByOwner('other-user')).toEqual([]);
    expect(
      repository.markCompleted(ownerDoc.id, 'other-user', 'Tentativa indevida'),
    ).toBeNull();
    expect(
      repository.markFailed(ownerDoc.id, 'other-user', 'FORCED_FAIL'),
    ).toBeNull();
    expect(repository.deleteByIdAndOwner(ownerDoc.id, 'other-user')).toBe(
      false,
    );

    expect(
      repository.findByIdAndOwner(ownerDoc.id, 'owner-user'),
    ).not.toBeNull();
    expect(repository.deleteByIdAndOwner(ownerDoc.id, 'owner-user')).toBe(true);
    expect(repository.findByIdAndOwner(ownerDoc.id, 'owner-user')).toBeNull();
  });

  it('rejects duplicate storageKey or empty completion analysis', () => {
    const repository = new InMemoryDocumentsRepository();

    const doc = repository.createProcessing({
      userId: 'user-1',
      title: 'Documento 1',
      instruction: 'Instrução 1',
      originalName: 'doc1.pdf',
      storageKey: 'users/user-1/documents/shared-key.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 512,
    });

    expect(() =>
      repository.createProcessing({
        userId: 'user-2',
        title: 'Documento 2',
        instruction: 'Instrução 2',
        originalName: 'doc2.pdf',
        storageKey: 'users/user-1/documents/shared-key.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 512,
      }),
    ).toThrow(/Duplicate document storageKey/);

    expect(() => repository.markCompleted(doc.id, 'user-1', '   ')).toThrow(
      /Completed document requires a non-empty analysis/,
    );
  });
});
