import { randomUUID } from 'node:crypto';
import { AuthenticationStorage } from '@nestjs/authentication';
import { authenticationStoreContract } from '@nestjs/authentication/testing';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { LoginTicket, type TokenPayload } from 'google-auth-library';
import { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { GOOGLE_TOKEN_VERIFIER } from '../src/auth/google/google-token-verifier.js';
import { PostgresSessionStore } from '../src/auth/postgres-session.store.js';
import { configureApplication } from '../src/bootstrap.js';
import type { Environment } from '../src/config/environment.schema.js';
import type { DrizzleDatabase } from '../src/database/database.constants.js';
import { runDatabaseMigrations } from '../src/database/migrate.js';
import {
  databaseSchema,
  documentsTable,
  sessionsTable,
  usersTable,
} from '../src/database/schema.js';
import { DocumentsRepository } from '../src/documents/documents.repository.js';
import { PostgresDocumentsRepository } from '../src/documents/postgres-documents.repository.js';
import { PostgresUsersRepository } from '../src/users/postgres-users.repository.js';
import { UsersRepository } from '../src/users/users.repository.js';

describe('PostgreSQL persistence (integration)', () => {
  let pool: Pool;
  let db: DrizzleDatabase;
  let usersRepository: PostgresUsersRepository;
  let documentsRepository: PostgresDocumentsRepository;

  beforeAll(async () => {
    const connectionString =
      process.env.DATABASE_URL ??
      'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital';
    pool = new Pool({ connectionString });
    db = drizzle(pool, { schema: databaseSchema });
    await runDatabaseMigrations(db);

    usersRepository = new PostgresUsersRepository(db);
    documentsRepository = new PostgresDocumentsRepository(db);
  });

  beforeEach(async () => {
    await db.delete(documentsTable);
    await db.delete(sessionsTable);
    await db.delete(usersTable);
  });

  afterAll(async () => {
    await db.delete(documentsTable);
    await db.delete(sessionsTable);
    await db.delete(usersTable);
    await pool.end();
  });

  describe('PostgresUsersRepository', () => {
    it('creates a new user and updates existing profile by googleSub without changing id', async () => {
      const created = await usersRepository.upsertGoogleProfile({
        googleSub: 'google-sub-123',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        avatarUrl: 'https://example.com/ada.png',
      });

      expect(created.id).toEqual(expect.any(String));
      expect(created.googleSub).toBe('google-sub-123');
      expect(await usersRepository.findById(created.id)).toEqual(created);

      const updated = await usersRepository.upsertGoogleProfile({
        googleSub: 'google-sub-123',
        name: 'Augusta Ada King',
        email: 'augusta@example.com',
        avatarUrl: null,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.createdAt.getTime()).toBe(created.createdAt.getTime());
      expect(updated.name).toBe('Augusta Ada King');
      expect(updated.email).toBe('augusta@example.com');
      expect(updated.avatarUrl).toBeNull();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it('returns null when user id does not exist', async () => {
      expect(await usersRepository.findById(randomUUID())).toBeNull();
    });
  });

  describe('PostgresSessionStore (@nestjs/authentication contract)', () => {
    const contractCases = authenticationStoreContract(
      async () => {
        await db.delete(sessionsTable);
        return { sessions: new PostgresSessionStore(db) };
      },
      {
        contracts: ['sessions'],
        concurrent: true,
      },
    );

    for (const testCase of contractCases) {
      it(testCase.name, async () => {
        await testCase.run();
      });
    }

    it('registers itself with AuthenticationStorage outside test environment', () => {
      const storage = new AuthenticationStorage({
        contracts: ['sessions'],
        allowInMemoryStorage: false,
      });
      const productionConfig = new ConfigService<Environment, true>({
        NODE_ENV: 'production',
        PORT: 3000,
        FRONTEND_URL: 'https://jusdigital.example.com',
        GOOGLE_CLIENT_ID: 'prod-google-client-id',
        DATABASE_URL:
          'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital',
      });

      const store = new PostgresSessionStore(db, storage, productionConfig);

      expect(storage.sessions).toBe(store);
    });
  });

  describe('PostgresDocumentsRepository', () => {
    it('persists document lifecycle from processing to completed and failed', async () => {
      const owner = await usersRepository.upsertGoogleProfile({
        googleSub: 'owner-sub',
        name: 'Owner',
        email: 'owner@example.com',
        avatarUrl: null,
      });

      const doc1 = await documentsRepository.createProcessing({
        userId: owner.id,
        title: 'Contrato Social',
        instruction: 'Extraia quadro societário',
        originalName: 'contrato-social.pdf',
        storageKey: `users/${owner.id}/documents/${randomUUID()}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 8_192,
      });

      expect(doc1.status).toBe('processing');
      expect(doc1.analysis).toBeNull();
      expect(doc1.failureCode).toBeNull();

      const completed = await documentsRepository.markCompleted(
        doc1.id,
        owner.id,
        'Quadro societário identificado com dois sócios.',
      );

      expect(completed).toMatchObject({
        id: doc1.id,
        userId: owner.id,
        status: 'completed',
        analysis: 'Quadro societário identificado com dois sócios.',
        failureCode: null,
      });

      const doc2 = await documentsRepository.createProcessing({
        userId: owner.id,
        title: 'Procuração',
        instruction: 'Verifique validade e poderes',
        originalName: 'procuracao.pdf',
        storageKey: `users/${owner.id}/documents/${randomUUID()}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 4_096,
      });

      const failed = await documentsRepository.markFailed(
        doc2.id,
        owner.id,
        'OPENAI_RATE_LIMIT',
      );

      expect(failed).toMatchObject({
        id: doc2.id,
        userId: owner.id,
        status: 'failed',
        analysis: null,
        failureCode: 'OPENAI_RATE_LIMIT',
      });

      const listed = await documentsRepository.listByOwner(owner.id);
      expect(listed.map((d) => d.id)).toEqual([doc2.id, doc1.id]);
    });

    it('enforces owner isolation across reads, updates and deletion (SEC-002)', async () => {
      const userA = await usersRepository.upsertGoogleProfile({
        googleSub: 'user-a-sub',
        name: 'User A',
        email: 'a@example.com',
        avatarUrl: null,
      });
      const userB = await usersRepository.upsertGoogleProfile({
        googleSub: 'user-b-sub',
        name: 'User B',
        email: 'b@example.com',
        avatarUrl: null,
      });

      const docA = await documentsRepository.createProcessing({
        userId: userA.id,
        title: 'Documento sigiloso A',
        instruction: 'Analise cláusulas',
        originalName: 'sigiloso.pdf',
        storageKey: `users/${userA.id}/documents/${randomUUID()}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 2_048,
      });

      expect(
        await documentsRepository.findByIdAndOwner(docA.id, userB.id),
      ).toBeNull();
      expect(await documentsRepository.listByOwner(userB.id)).toEqual([]);
      expect(
        await documentsRepository.markCompleted(
          docA.id,
          userB.id,
          'Análise indevida',
        ),
      ).toBeNull();
      expect(
        await documentsRepository.markFailed(
          docA.id,
          userB.id,
          'UNAUTHORIZED_ATTEMPT',
        ),
      ).toBeNull();
      expect(
        await documentsRepository.deleteByIdAndOwner(docA.id, userB.id),
      ).toBe(false);

      const intact = await documentsRepository.findByIdAndOwner(
        docA.id,
        userA.id,
      );
      expect(intact).toMatchObject({
        id: docA.id,
        userId: userA.id,
        status: 'processing',
        analysis: null,
      });

      expect(
        await documentsRepository.deleteByIdAndOwner(docA.id, userA.id),
      ).toBe(true);
      expect(
        await documentsRepository.findByIdAndOwner(docA.id, userA.id),
      ).toBeNull();
    });

    it('enforces database constraints for unique storageKey, completed analysis and cascade delete', async () => {
      const owner = await usersRepository.upsertGoogleProfile({
        googleSub: 'constraint-sub',
        name: 'Constraint User',
        email: 'constraint@example.com',
        avatarUrl: null,
      });
      const duplicateKey = `users/${owner.id}/documents/unique-key.pdf`;

      const created = await documentsRepository.createProcessing({
        userId: owner.id,
        title: 'Doc 1',
        instruction: 'Inst 1',
        originalName: 'doc1.pdf',
        storageKey: duplicateKey,
        mimeType: 'application/pdf',
        sizeBytes: 1_024,
      });

      await expect(
        documentsRepository.createProcessing({
          userId: owner.id,
          title: 'Doc 2',
          instruction: 'Inst 2',
          originalName: 'doc2.pdf',
          storageKey: duplicateKey,
          mimeType: 'application/pdf',
          sizeBytes: 1_024,
        }),
      ).rejects.toThrow();

      await expect(
        db
          .update(documentsTable)
          .set({ status: 'completed', analysis: null })
          .where(eq(documentsTable.id, created.id)),
      ).rejects.toThrow();

      await db.delete(usersTable).where(eq(usersTable.id, owner.id));
      expect(
        await documentsRepository.findByIdAndOwner(created.id, owner.id),
      ).toBeNull();
    });
  });

  describe('Full system journey: Google Auth HTTP + PostgreSQL persistence', () => {
    let app: INestApplication<App>;
    const verifyIdToken = vi.fn();

    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(GOOGLE_TOKEN_VERIFIER)
        .useValue({ verifyIdToken })
        .overrideProvider(UsersRepository)
        .useFactory({
          inject: [PostgresUsersRepository],
          factory: (repo: PostgresUsersRepository) => repo,
        })
        .overrideProvider(DocumentsRepository)
        .useFactory({
          inject: [PostgresDocumentsRepository],
          factory: (repo: PostgresDocumentsRepository) => repo,
        })
        .compile();

      const storage = moduleFixture.get(AuthenticationStorage);
      const pgSessionStore = moduleFixture.get(PostgresSessionStore);
      storage.registerSource({ sessions: pgSessionStore }, { replace: true });

      app = moduleFixture.createNestApplication();
      configureApplication(app);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
      vi.clearAllMocks();
    });

    it('authenticates via popup and redirect, persists users/sessions/documents in PostgreSQL and revokes session on logout', async () => {
      const agentA = request.agent(app.getHttpServer());
      const googleSubA = 'google-sub-journey-user-a';

      const initialPayload: TokenPayload = {
        iss: 'https://accounts.google.com',
        aud: 'google-client-id',
        iat: 1,
        exp: 4_102_444_800,
        sub: googleSubA,
        email: 'maria.silva@example.com',
        email_verified: true,
        name: 'Maria Silva',
        picture: 'https://example.com/maria-v1.png',
      };
      verifyIdToken.mockResolvedValueOnce(new LoginTicket('', initialPayload));

      // 1. Health check
      await agentA
        .get('/api/v1/health')
        .expect(HttpStatus.OK)
        .expect({ status: 'ok' });

      // 2. Popup Google login -> persists user and session in PostgreSQL
      const popupLogin = await agentA
        .post('/api/v1/auth/google')
        .set('Origin', 'http://localhost:5173')
        .send({ credential: 'valid-google-token-v1' })
        .expect(HttpStatus.OK);

      const userIdA = popupLogin.body.user.id as string;
      expect(popupLogin.body).toEqual({
        user: {
          id: expect.any(String),
          name: 'Maria Silva',
          email: 'maria.silva@example.com',
          avatarUrl: 'https://example.com/maria-v1.png',
        },
      });

      const [persistedUserV1] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userIdA));
      expect(persistedUserV1).toMatchObject({
        id: userIdA,
        googleSub: googleSubA,
        name: 'Maria Silva',
        email: 'maria.silva@example.com',
      });

      const activeSessionsAfterPopup = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.userId, userIdA));
      expect(activeSessionsAfterPopup).toHaveLength(1);

      // 3. Authenticated /auth/me reads from PostgreSQL session + user
      await agentA
        .get('/api/v1/auth/me')
        .expect(HttpStatus.OK)
        .expect(popupLogin.body);

      // 4. Same-tab redirect login updates profile in PostgreSQL while preserving user.id
      const updatedPayload: TokenPayload = {
        ...initialPayload,
        name: 'Maria Silva Santos',
        picture: 'https://example.com/maria-v2.png',
      };
      verifyIdToken.mockResolvedValueOnce(new LoginTicket('', updatedPayload));

      const csrfToken = 'journey-csrf-token';
      await agentA
        .post('/api/v1/auth/google/callback')
        .set('Origin', 'https://accounts.google.com')
        .set('Sec-Fetch-Site', 'cross-site')
        .set('Cookie', `g_csrf_token=${csrfToken}`)
        .type('form')
        .send({
          credential: 'valid-google-token-v2',
          g_csrf_token: csrfToken,
        })
        .expect(HttpStatus.SEE_OTHER)
        .expect('Location', 'http://localhost:5173/auth/callback');

      await agentA
        .get('/api/v1/auth/me')
        .expect(HttpStatus.OK)
        .expect({
          user: {
            id: userIdA,
            name: 'Maria Silva Santos',
            email: 'maria.silva@example.com',
            avatarUrl: 'https://example.com/maria-v2.png',
          },
        });

      // 5. Upload a document via HTTP multipart/form-data and complete its analysis in PostgreSQL
      const uploadResponse = await agentA
        .post('/api/v1/documents')
        .set('Origin', 'http://localhost:5173')
        .field('title', 'Acordo Extrajudicial')
        .field('instruction', 'Verifique cláusula penal e foro de eleição')
        .attach(
          'file',
          Buffer.from('%PDF-1.7\nAcordo extrajudicial entre as partes.'),
          {
            filename: 'acordo.pdf',
            contentType: 'application/pdf',
          },
        )
        .expect(HttpStatus.CREATED);

      const uploadedDocumentId = uploadResponse.body.document.id as string;
      expect(uploadResponse.body.document).toMatchObject({
        id: expect.any(String),
        title: 'Acordo Extrajudicial',
        instruction: 'Verifique cláusula penal e foro de eleição',
        originalName: 'acordo.pdf',
        mimeType: 'application/pdf',
        status: 'processing',
        analysis: null,
      });
      expect(uploadResponse.body.document).not.toHaveProperty('storageKey');

      const appDocsRepo = app.get(DocumentsRepository);
      await appDocsRepo.markCompleted(
        uploadedDocumentId,
        userIdA,
        'Cláusula penal de 10% e foro da comarca de São Paulo.',
      );

      const userADocs = await appDocsRepo.listByOwner(userIdA);
      expect(userADocs).toHaveLength(1);
      expect(userADocs[0]).toMatchObject({
        id: uploadedDocumentId,
        userId: userIdA,
        status: 'completed',
      });

      // 6. Logout revokes session in PostgreSQL
      await agentA
        .post('/api/v1/auth/logout')
        .set('Origin', 'http://localhost:5173')
        .expect(HttpStatus.NO_CONTENT);

      await agentA.get('/api/v1/auth/me').expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
