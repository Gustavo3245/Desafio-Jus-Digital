import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { LoginTicket, type TokenPayload } from 'google-auth-library';
import request, { type Agent } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { GOOGLE_TOKEN_VERIFIER } from '../src/auth/google/google-token-verifier.js';
import { configureApplication } from '../src/bootstrap.js';

const verifiedPayload: TokenPayload = {
  iss: 'https://accounts.google.com',
  aud: 'google-client-id',
  iat: 1,
  exp: 4_102_444_800,
  sub: 'google-subject',
  email: 'person@example.com',
  email_verified: true,
  name: 'Test Person',
  picture: 'https://example.com/avatar.png',
};

describe('Google authentication (e2e)', () => {
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

  it('creates, reads and revokes a session', async () => {
    const login = await agent
      .post('/api/v1/auth/google')
      .set('Origin', 'http://localhost:5173')
      .send({ credential: 'google-id-token' })
      .expect(HttpStatus.OK);

    expect(login.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(login.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
    expect(login.body).toEqual({
      user: {
        id: expect.any(String),
        name: 'Test Person',
        email: 'person@example.com',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    await agent.get('/api/v1/auth/me').expect(HttpStatus.OK).expect(login.body);

    await agent
      .post('/api/v1/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .expect(HttpStatus.NO_CONTENT);

    await agent.get('/api/v1/auth/me').expect(HttpStatus.UNAUTHORIZED);
  });

  it('rejects an invalid Google credential without issuing a cookie', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid signature'));

    const response = await agent
      .post('/api/v1/auth/google')
      .set('Origin', 'http://localhost:5173')
      .send({ credential: 'invalid-token' })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).toMatchObject({
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  });

  it('validates the login payload before calling Google', async () => {
    await agent
      .post('/api/v1/auth/google')
      .set('Origin', 'http://localhost:5173')
      .send({ credential: '' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('keeps the health endpoint public', async () => {
    await agent
      .get('/api/v1/health')
      .expect(HttpStatus.OK)
      .expect({ status: 'ok' });
  });
});
