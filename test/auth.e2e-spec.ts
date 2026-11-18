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

const googleOrigin = 'https://accounts.google.com';
const frontendAuthCallback = 'http://localhost:5173/auth/callback';

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

  it('creates a session from a valid Google redirect callback', async () => {
    const csrfToken = 'google-csrf-token';
    const response = await agent
      .post('/api/v1/auth/google/callback')
      .set('Origin', googleOrigin)
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Cookie', `g_csrf_token=${csrfToken}`)
      .type('form')
      .send({
        credential: 'google-id-token',
        g_csrf_token: csrfToken,
      })
      .expect(HttpStatus.SEE_OTHER);

    expect(response.headers.location).toBe(frontendAuthCallback);
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    await agent.get('/api/v1/auth/me').expect(HttpStatus.OK);
  });

  it.each([
    ['a missing cookie', undefined],
    ['a mismatched cookie', 'different-csrf-token'],
  ])('rejects the Google callback with %s', async (_case, cookieToken) => {
    const csrfToken = 'google-csrf-token';
    const login = request(app.getHttpServer())
      .post('/api/v1/auth/google/callback')
      .set('Origin', googleOrigin)
      .set('Sec-Fetch-Site', 'cross-site')
      .type('form')
      .send({
        credential: 'google-id-token',
        g_csrf_token: csrfToken,
      });

    if (cookieToken) {
      login.set('Cookie', `g_csrf_token=${cookieToken}`);
    }

    const response = await login.expect(HttpStatus.FORBIDDEN);

    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).toMatchObject({ code: 'INVALID_GOOGLE_CSRF_TOKEN' });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('returns a safe error after an invalid redirect credential', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid signature'));
    const csrfToken = 'google-csrf-token';

    const response = await agent
      .post('/api/v1/auth/google/callback')
      .set('Origin', googleOrigin)
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Cookie', `g_csrf_token=${csrfToken}`)
      .type('form')
      .send({
        credential: 'invalid-token',
        g_csrf_token: csrfToken,
      })
      .expect(HttpStatus.SEE_OTHER);

    expect(response.headers.location).toBe(
      `${frontendAuthCallback}?error=invalid_google_credential`,
    );
    expect(response.headers['set-cookie']).toBeUndefined();
    await agent.get('/api/v1/auth/me').expect(HttpStatus.UNAUTHORIZED);
  });

  it('returns a safe error for an unverified Google email', async () => {
    verifyIdToken.mockResolvedValueOnce(
      new LoginTicket('', { ...verifiedPayload, email_verified: false }),
    );
    const csrfToken = 'google-csrf-token';

    const response = await agent
      .post('/api/v1/auth/google/callback')
      .set('Origin', googleOrigin)
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Cookie', `g_csrf_token=${csrfToken}`)
      .type('form')
      .send({
        credential: 'google-id-token',
        g_csrf_token: csrfToken,
      })
      .expect(HttpStatus.SEE_OTHER);

    expect(response.headers.location).toBe(
      `${frontendAuthCallback}?error=google_email_not_verified`,
    );
    expect(response.headers['set-cookie']).toBeUndefined();
    await agent.get('/api/v1/auth/me').expect(HttpStatus.UNAUTHORIZED);
  });

  it('rejects a redirect callback from an untrusted origin', async () => {
    const csrfToken = 'google-csrf-token';

    const response = await agent
      .post('/api/v1/auth/google/callback')
      .set('Origin', 'https://attacker.example')
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Cookie', `g_csrf_token=${csrfToken}`)
      .type('form')
      .send({
        credential: 'google-id-token',
        g_csrf_token: csrfToken,
      })
      .expect(HttpStatus.FORBIDDEN);

    expect(response.headers['set-cookie']).toBeUndefined();
    await agent.get('/api/v1/auth/me').expect(HttpStatus.UNAUTHORIZED);
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
