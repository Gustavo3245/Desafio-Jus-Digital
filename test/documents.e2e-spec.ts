import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { LoginTicket, type TokenPayload } from 'google-auth-library';
import request, { type Agent } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { GOOGLE_TOKEN_VERIFIER } from '../src/auth/google/google-token-verifier.js';
import { configureApplication } from '../src/bootstrap.js';
import { MAX_DOCUMENT_SIZE_BYTES } from '../src/documents/document-file-validator.js';
import { DocumentsRepository } from '../src/documents/documents.repository.js';
import {
  DocumentAnalysisService,
  ExternalAnalysisUnavailableException,
  InvalidAnalysisResponseException,
} from '../src/integrations/openai/document-analysis.service.js';
import {
  DocumentStorageService,
  ExternalStorageUnavailableException,
} from '../src/integrations/storage/document-storage.service.js';
import { InMemoryDocumentStorageService } from '../src/integrations/storage/in-memory-document-storage.service.js';

const verifiedPayload: TokenPayload = {
  iss: 'https://accounts.google.com',
  aud: 'google-client-id',
  iat: 1,
  exp: 4_102_444_800,
  sub: 'google-subject-doc-uploader',
  email: 'uploader@example.com',
  email_verified: true,
  name: 'Document Uploader',
  picture: 'https://example.com/avatar.png',
};

const frontendOrigin = 'http://localhost:5173';

describe('Document upload and storage (e2e)', () => {
  let app: INestApplication<App>;
  let agent: Agent;
  const verifyIdToken = vi.fn();

  beforeEach(async () => {
    verifyIdToken.mockResolvedValue(new LoginTicket('', verifiedPayload));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GOOGLE_TOKEN_VERIFIER)
      .useValue({ verifyIdToken })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  async function signIn(): Promise<string> {
    const login = await agent
      .post('/api/v1/auth/google')
      .set('Origin', frontendOrigin)
      .send({ credential: 'google-id-token' })
      .expect(HttpStatus.OK);

    return login.body.user.id as string;
  }

  it('uploads, stores and analyzes a valid PDF without exposing storageKey', async () => {
    const userId = await signIn();
    const pdfBuffer = Buffer.from('%PDF-1.7\nCláusula 1ª - Do Objeto.');

    const response = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato de Prestação de Serviços')
      .field('instruction', 'Resuma as cláusulas de rescisão e multa')
      .attach('file', pdfBuffer, {
        filename: 'contrato.pdf',
        contentType: 'application/pdf',
      })
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      document: {
        id: expect.any(String),
        title: 'Contrato de Prestação de Serviços',
        instruction: 'Resuma as cláusulas de rescisão e multa',
        originalName: 'contrato.pdf',
        mimeType: 'application/pdf',
        sizeBytes: pdfBuffer.byteLength,
        status: 'completed',
        analysis:
          'Análise simulada concluída para a instrução: Resuma as cláusulas de rescisão e multa',
        failureCode: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
    expect(response.body.document).not.toHaveProperty('storageKey');
    expect(response.body.document).not.toHaveProperty('userId');

    const repository = app.get(DocumentsRepository);
    const storage = app.get(InMemoryDocumentStorageService);
    const persisted = await repository.findByIdAndOwner(
      response.body.document.id as string,
      userId,
    );

    expect(persisted).not.toBeNull();
    expect(persisted?.storageKey).toMatch(
      new RegExp(`^users/${userId}/documents/[0-9a-f-]{36}\\.pdf$`),
    );
    expect(storage.hasObject(persisted?.storageKey ?? '')).toBe(true);
  });

  it('rejects unauthenticated upload attempts with 401', async () => {
    await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('%PDF-1.7\ntest'), 'contrato.pdf')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('rejects missing, unsupported, forged or oversized files with 400 INVALID_FILE and specific messages', async () => {
    await signIn();

    const missingFile = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .field('instruction', 'Analise')
      .expect(HttpStatus.BAD_REQUEST);
    expect(missingFile.body).toEqual({
      code: 'INVALID_FILE',
      message: 'Document file is required',
    });

    const unsupportedFile = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Planilha')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('col1,col2\n1,2'), {
        filename: 'planilha.csv',
        contentType: 'text/csv',
      })
      .expect(HttpStatus.BAD_REQUEST);
    expect(unsupportedFile.body).toEqual({
      code: 'INVALID_FILE',
      message:
        'Unsupported document format; allowed formats are PDF, DOCX, DOC and TXT',
    });

    const emptyFile = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Arquivo Vazio')
      .field('instruction', 'Analise')
      .attach('file', Buffer.alloc(0), {
        filename: 'vazio.pdf',
        contentType: 'application/pdf',
      })
      .expect(HttpStatus.BAD_REQUEST);
    expect(emptyFile.body).toEqual({
      code: 'INVALID_FILE',
      message: 'Document file cannot be empty',
    });

    const forgedPdf = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('<html>not a pdf</html>'), {
        filename: 'falso.pdf',
        contentType: 'application/pdf',
      })
      .expect(HttpStatus.BAD_REQUEST);
    expect(forgedPdf.body).toEqual({
      code: 'INVALID_FILE',
      message: 'File content does not match a valid PDF document',
    });

    const oversizedPdf = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato Grande')
      .field('instruction', 'Analise')
      .attach('file', Buffer.alloc(MAX_DOCUMENT_SIZE_BYTES + 128, 0x25), {
        filename: 'grande.pdf',
        contentType: 'application/pdf',
      })
      .expect(HttpStatus.BAD_REQUEST);
    expect(oversizedPdf.body).toEqual({
      code: 'INVALID_FILE',
      message: 'Document file exceeds the 10 MB maximum size',
    });
  });

  it('rejects missing, blank or over-limit title and instruction before uploading', async () => {
    await signIn();

    const blankTitle = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', '   ')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('%PDF-1.7\ncontent'), 'contrato.pdf')
      .expect(HttpStatus.BAD_REQUEST);
    expect(blankTitle.body).toMatchObject({
      message: ['title: Document title is required'],
    });

    const oversizedTitle = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'T'.repeat(151))
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('%PDF-1.7\ncontent'), 'contrato.pdf')
      .expect(HttpStatus.BAD_REQUEST);
    expect(oversizedTitle.body).toMatchObject({
      message: ['title: Document title must be at most 150 characters'],
    });

    const missingInstruction = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .attach('file', Buffer.from('%PDF-1.7\ncontent'), 'contrato.pdf')
      .expect(HttpStatus.BAD_REQUEST);
    expect(missingInstruction.body).toMatchObject({
      message: ['instruction: Document instruction is required'],
    });

    const oversizedInstruction = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .field('instruction', 'I'.repeat(2_001))
      .attach('file', Buffer.from('%PDF-1.7\ncontent'), 'contrato.pdf')
      .expect(HttpStatus.BAD_REQUEST);
    expect(oversizedInstruction.body).toMatchObject({
      message: [
        'instruction: Document instruction must be at most 2000 characters',
      ],
    });
  });

  it('returns 503 EXTERNAL_SERVICE_UNAVAILABLE and persists nothing when storage fails', async () => {
    const userId = await signIn();
    const storage = app.get(DocumentStorageService);
    vi.spyOn(storage, 'uploadObject').mockRejectedValueOnce(
      new ExternalStorageUnavailableException(),
    );

    const response = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('%PDF-1.7\ncontent'), 'contrato.pdf')
      .expect(HttpStatus.SERVICE_UNAVAILABLE);

    expect(response.body).toMatchObject({
      code: 'EXTERNAL_SERVICE_UNAVAILABLE',
    });

    const repository = app.get(DocumentsRepository);
    expect(await repository.listByOwner(userId)).toEqual([]);
  });

  it('returns 503 and persists a failed state when the analysis provider is unavailable', async () => {
    const userId = await signIn();
    const analysis = app.get(DocumentAnalysisService);
    vi.spyOn(analysis, 'analyzeDocument').mockRejectedValueOnce(
      new ExternalAnalysisUnavailableException(),
    );

    const response = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('%PDF-1.7\ncontent'), 'contrato.pdf')
      .expect(HttpStatus.SERVICE_UNAVAILABLE);

    expect(response.body).toEqual({
      code: 'EXTERNAL_SERVICE_UNAVAILABLE',
      message: 'Document analysis service is temporarily unavailable',
    });
    expect(await app.get(DocumentsRepository).listByOwner(userId)).toEqual([
      expect.objectContaining({
        status: 'failed',
        analysis: null,
        failureCode: 'ANALYSIS_PROVIDER_UNAVAILABLE',
      }),
    ]);
  });

  it('returns 502 ANALYSIS_FAILED and persists a failed state for an empty response', async () => {
    const userId = await signIn();
    const analysis = app.get(DocumentAnalysisService);
    vi.spyOn(analysis, 'analyzeDocument').mockRejectedValueOnce(
      new InvalidAnalysisResponseException(),
    );

    const response = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('%PDF-1.7\ncontent'), 'contrato.pdf')
      .expect(HttpStatus.BAD_GATEWAY);

    expect(response.body).toEqual({
      code: 'ANALYSIS_FAILED',
      message: 'Document analysis could not be completed',
    });
    expect(await app.get(DocumentsRepository).listByOwner(userId)).toEqual([
      expect.objectContaining({
        status: 'failed',
        analysis: null,
        failureCode: 'ANALYSIS_INVALID_RESPONSE',
      }),
    ]);
  });

  it('restores document history and detail after logout and login', async () => {
    await signIn();
    const upload = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Histórico persistente')
      .field('instruction', 'Resuma os pontos principais')
      .attach('file', Buffer.from('Documento de histórico persistente'), {
        filename: 'historico.txt',
        contentType: 'text/plain',
      })
      .expect(HttpStatus.CREATED);
    const documentId = upload.body.document.id as string;

    const initialHistory = await agent
      .get('/api/v1/documents')
      .expect(HttpStatus.OK);
    expect(initialHistory.body.documents).toEqual([
      expect.objectContaining({
        id: documentId,
        instruction: 'Resuma os pontos principais',
        status: 'completed',
      }),
    ]);
    expect(initialHistory.body.documents[0]).not.toHaveProperty('storageKey');
    expect(initialHistory.body.documents[0]).not.toHaveProperty('userId');

    await agent
      .post('/api/v1/auth/logout')
      .set('Origin', frontendOrigin)
      .expect(HttpStatus.NO_CONTENT);
    await agent.get('/api/v1/documents').expect(HttpStatus.UNAUTHORIZED);

    await signIn();
    const restoredHistory = await agent
      .get('/api/v1/documents')
      .expect(HttpStatus.OK);
    expect(restoredHistory.body).toEqual(initialHistory.body);

    const detail = await agent
      .get(`/api/v1/documents/${documentId}`)
      .expect(HttpStatus.OK);
    expect(detail.body.document).toEqual(upload.body.document);
  });

  it('deletes an owned document from storage and history', async () => {
    const userId = await signIn();
    const upload = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Documento descartável')
      .field('instruction', 'Resuma')
      .attach('file', Buffer.from('Documento que será removido'), {
        filename: 'descartavel.txt',
        contentType: 'text/plain',
      })
      .expect(HttpStatus.CREATED);
    const documentId = upload.body.document.id as string;
    const repository = app.get(DocumentsRepository);
    const storage = app.get(InMemoryDocumentStorageService);
    const persisted = await repository.findByIdAndOwner(documentId, userId);
    const storageKey = persisted?.storageKey ?? '';

    await agent
      .delete(`/api/v1/documents/${documentId}`)
      .set('Origin', frontendOrigin)
      .expect(HttpStatus.NO_CONTENT);

    expect(await repository.findByIdAndOwner(documentId, userId)).toBeNull();
    expect(storage.hasObject(storageKey)).toBe(false);
    await agent
      .get(`/api/v1/documents/${documentId}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('preserves the document when storage deletion is unavailable', async () => {
    const userId = await signIn();
    const upload = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Documento para retry')
      .field('instruction', 'Resuma')
      .attach('file', Buffer.from('Documento que permanecerá persistido'), {
        filename: 'retry.txt',
        contentType: 'text/plain',
      })
      .expect(HttpStatus.CREATED);
    const documentId = upload.body.document.id as string;
    vi.spyOn(
      app.get(DocumentStorageService),
      'deleteObject',
    ).mockRejectedValueOnce(new ExternalStorageUnavailableException());

    const response = await agent
      .delete(`/api/v1/documents/${documentId}`)
      .set('Origin', frontendOrigin)
      .expect(HttpStatus.SERVICE_UNAVAILABLE);

    expect(response.body).toMatchObject({
      code: 'EXTERNAL_SERVICE_UNAVAILABLE',
    });
    expect(
      await app.get(DocumentsRepository).findByIdAndOwner(documentId, userId),
    ).not.toBeNull();
  });

  it('does not list or reveal a document owned by another user', async () => {
    await signIn();
    const upload = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Documento privado')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('Documento privado do primeiro usuário'), {
        filename: 'privado.txt',
        contentType: 'text/plain',
      })
      .expect(HttpStatus.CREATED);
    const documentId = upload.body.document.id as string;

    const otherPayload: TokenPayload = {
      ...verifiedPayload,
      sub: 'google-subject-other-user',
      email: 'other@example.com',
      name: 'Other User',
    };
    verifyIdToken.mockResolvedValueOnce(new LoginTicket('', otherPayload));
    const otherAgent = request.agent(app.getHttpServer());
    await otherAgent
      .post('/api/v1/auth/google')
      .set('Origin', frontendOrigin)
      .send({ credential: 'other-google-id-token' })
      .expect(HttpStatus.OK);

    await otherAgent
      .get('/api/v1/documents')
      .expect(HttpStatus.OK)
      .expect({ documents: [] });
    const hidden = await otherAgent
      .get(`/api/v1/documents/${documentId}`)
      .expect(HttpStatus.NOT_FOUND);
    expect(hidden.body).toEqual({
      code: 'DOCUMENT_NOT_FOUND',
      message: 'Document was not found',
    });
    const forbiddenDeletion = await otherAgent
      .delete(`/api/v1/documents/${documentId}`)
      .set('Origin', frontendOrigin)
      .expect(HttpStatus.NOT_FOUND);
    expect(forbiddenDeletion.body).toEqual(hidden.body);
    await agent.get(`/api/v1/documents/${documentId}`).expect(HttpStatus.OK);
  });
});
