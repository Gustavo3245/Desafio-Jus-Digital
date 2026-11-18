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

  it('rejects missing, forged or oversized files with 400 INVALID_FILE', async () => {
    await signIn();

    const missingFile = await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', 'Contrato')
      .field('instruction', 'Analise')
      .expect(HttpStatus.BAD_REQUEST);
    expect(missingFile.body).toMatchObject({ code: 'INVALID_FILE' });

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
    expect(forgedPdf.body).toMatchObject({ code: 'INVALID_FILE' });

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
    expect(oversizedPdf.body).toMatchObject({ code: 'INVALID_FILE' });
  });

  it('rejects missing or blank title and instruction before uploading', async () => {
    await signIn();

    await agent
      .post('/api/v1/documents')
      .set('Origin', frontendOrigin)
      .field('title', '   ')
      .field('instruction', 'Analise')
      .attach('file', Buffer.from('%PDF-1.7\ncontent'), 'contrato.pdf')
      .expect(HttpStatus.BAD_REQUEST);
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
});
