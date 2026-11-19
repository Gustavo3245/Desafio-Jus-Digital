import { describe, expect, it, vi } from 'vitest';
import { createAuthenticationApi, getGoogleCallbackUrl } from './auth-api.js';
import { AuthenticationHttpError } from './auth-errors.js';

describe('createAuthenticationApi', () => {
  it('loads the current user with session credentials', async () => {
    const user = {
      id: 'user-1',
      name: 'Mariana Gomes',
      email: 'mariana@example.com',
      avatarUrl: null,
    };
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const api = createAuthenticationApi(
      'http://localhost:3000/api/v1/',
      fetchImplementation,
    );

    await expect(api.getCurrentUser()).resolves.toEqual(user);
    expect(fetchImplementation).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('preserves only the safe status and code from an error response', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          errorCode: 'missing_credentials',
          message: 'internal message that must not be rendered',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    const api = createAuthenticationApi(
      'http://localhost:3000/api/v1',
      fetchImplementation,
    );

    await expect(api.getCurrentUser()).rejects.toMatchObject({
      status: 401,
      code: 'missing_credentials',
    } satisfies Partial<AuthenticationHttpError>);
  });

  it('revokes the current session with a credentialed POST', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const api = createAuthenticationApi(
      'http://localhost:3000/api/v1',
      fetchImplementation,
    );

    await api.logout();

    expect(fetchImplementation).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });
});

describe('getGoogleCallbackUrl', () => {
  it('builds the callback endpoint without duplicate slashes', () => {
    expect(getGoogleCallbackUrl('http://localhost:3000/api/v1/')).toBe(
      'http://localhost:3000/api/v1/auth/google/callback',
    );
  });
});
