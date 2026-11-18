import { ExternalStorageUnavailableException } from '../integrations/storage/document-storage.service.js';
import { InMemoryDocumentStorageService } from '../integrations/storage/in-memory-document-storage.service.js';
import {
  ExternalAnalysisUnavailableException,
  InvalidAnalysisResponseException,
} from '../integrations/openai/document-analysis.service.js';
import { InMemoryDocumentAnalysisService } from '../integrations/openai/in-memory-document-analysis.service.js';
import { InvalidDocumentFileException } from './document-file-validator.js';
import { DocumentsService } from './documents.service.js';
import { InMemoryDocumentsRepository } from './in-memory-documents.repository.js';

describe('DocumentsService', () => {
  let repository: InMemoryDocumentsRepository;
  let storage: InMemoryDocumentStorageService;
  let analysis: InMemoryDocumentAnalysisService;
  let service: DocumentsService;

  beforeEach(() => {
    repository = new InMemoryDocumentsRepository();
    storage = new InMemoryDocumentStorageService();
    analysis = new InMemoryDocumentAnalysisService();
    service = new DocumentsService(repository, storage, analysis);
  });

  it('validates, stores and analyzes the document before returning it', async () => {
    const pdfBytes = Buffer.from('%PDF-1.7\nContrato de locação comercial');

    const created = await service.createDocument({
      userId: 'user-1',
      title: 'Contrato de Locação',
      instruction: 'Verifique prazo, multa e garantias',
      file: {
        originalname: 'locacao.pdf',
        mimetype: 'application/pdf',
        buffer: pdfBytes,
      },
    });

    expect(created).toMatchObject({
      userId: 'user-1',
      title: 'Contrato de Locação',
      instruction: 'Verifique prazo, multa e garantias',
      originalName: 'locacao.pdf',
      mimeType: 'application/pdf',
      sizeBytes: pdfBytes.byteLength,
      status: 'completed',
      analysis:
        'Análise simulada concluída para a instrução: Verifique prazo, multa e garantias',
      failureCode: null,
    });
    expect(created.storageKey).toMatch(
      /^users\/user-1\/documents\/[0-9a-f-]{36}\.pdf$/,
    );
    expect(storage.hasObject(created.storageKey)).toBe(true);
    expect(await storage.getObjectBytes(created.storageKey)).toEqual(pdfBytes);
  });

  it('does not call storage or database when the file is invalid', async () => {
    const uploadSpy = vi.spyOn(storage, 'uploadObject');
    const createSpy = vi.spyOn(repository, 'createProcessing');
    const analysisSpy = vi.spyOn(analysis, 'analyzeDocument');

    await expect(
      service.createDocument({
        userId: 'user-1',
        title: 'Arquivo inválido',
        instruction: 'Analise',
        file: {
          originalname: 'falso.pdf',
          buffer: Buffer.from('not a pdf'),
        },
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentFileException);

    expect(uploadSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
    expect(analysisSpy).not.toHaveBeenCalled();
  });

  it('does not create a database record when S3 upload fails', async () => {
    vi.spyOn(storage, 'uploadObject').mockRejectedValueOnce(
      new ExternalStorageUnavailableException(),
    );
    const createSpy = vi.spyOn(repository, 'createProcessing');

    await expect(
      service.createDocument({
        userId: 'user-1',
        title: 'Contrato',
        instruction: 'Analise',
        file: {
          originalname: 'contrato.pdf',
          buffer: Buffer.from('%PDF-1.7\ncontent'),
        },
      }),
    ).rejects.toBeInstanceOf(ExternalStorageUnavailableException);

    expect(createSpy).not.toHaveBeenCalled();
    expect(repository.listByOwner('user-1')).toEqual([]);
  });

  it('deletes the uploaded object from storage as compensation when database persistence fails', async () => {
    vi.spyOn(repository, 'createProcessing').mockImplementationOnce(() => {
      throw new Error('database insert failure');
    });
    const deleteSpy = vi.spyOn(storage, 'deleteObject');

    await expect(
      service.createDocument({
        userId: 'user-1',
        title: 'Contrato',
        instruction: 'Analise',
        file: {
          originalname: 'contrato.pdf',
          buffer: Buffer.from('%PDF-1.7\ncontent'),
        },
      }),
    ).rejects.toThrow('database insert failure');

    expect(deleteSpy).toHaveBeenCalledTimes(1);
    const deletedKey = deleteSpy.mock.calls[0]?.[0] ?? '';
    expect(storage.hasObject(deletedKey)).toBe(false);
  });

  it('marks the document as failed when the analysis provider is unavailable', async () => {
    vi.spyOn(analysis, 'analyzeDocument').mockRejectedValueOnce(
      new ExternalAnalysisUnavailableException(),
    );

    await expect(
      service.createDocument({
        userId: 'user-1',
        title: 'Contrato',
        instruction: 'Analise',
        file: {
          originalname: 'contrato.pdf',
          buffer: Buffer.from('%PDF-1.7\ncontent'),
        },
      }),
    ).rejects.toBeInstanceOf(ExternalAnalysisUnavailableException);

    expect(repository.listByOwner('user-1')).toEqual([
      expect.objectContaining({
        status: 'failed',
        analysis: null,
        failureCode: 'ANALYSIS_PROVIDER_UNAVAILABLE',
      }),
    ]);
  });

  it('marks the document as failed when the provider returns no analysis', async () => {
    vi.spyOn(analysis, 'analyzeDocument').mockRejectedValueOnce(
      new InvalidAnalysisResponseException(),
    );

    await expect(
      service.createDocument({
        userId: 'user-1',
        title: 'Contrato',
        instruction: 'Analise',
        file: {
          originalname: 'contrato.pdf',
          buffer: Buffer.from('%PDF-1.7\ncontent'),
        },
      }),
    ).rejects.toBeInstanceOf(InvalidAnalysisResponseException);

    expect(repository.listByOwner('user-1')).toEqual([
      expect.objectContaining({
        status: 'failed',
        analysis: null,
        failureCode: 'ANALYSIS_INVALID_RESPONSE',
      }),
    ]);
  });
});
