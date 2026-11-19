import { AuthenticationHttpError } from './auth-errors.js';
import type { UserProfile } from './auth.types.js';

interface AuthenticationResponse {
  user: UserProfile;
}

interface ErrorResponse {
  code?: unknown;
  errorCode?: unknown;
}

export interface AuthenticationApi {
  getCurrentUser(): Promise<UserProfile>;
  logout(): Promise<void>;
}

type FetchImplementation = typeof fetch;

const defaultTimeoutMs = 10_000;

export function createAuthenticationApi(
  baseUrl: string,
  fetchImplementation: FetchImplementation = fetch,
  timeoutMs = defaultTimeoutMs,
): AuthenticationApi {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  async function request(path: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = new Headers(init?.headers);
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      const requestInit = Object.assign({}, init, {
        credentials: 'include' as const,
        headers,
        signal: controller.signal,
      });
      const response = await fetchImplementation(
        `${normalizedBaseUrl}${path}`,
        requestInit,
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ErrorResponse;
        const rawCode = body.code ?? body.errorCode;
        throw new AuthenticationHttpError(
          response.status,
          typeof rawCode === 'string' ? rawCode : null,
        );
      }

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async getCurrentUser() {
      const response = await request('/auth/me');
      const body = (await response.json()) as AuthenticationResponse;
      return body.user;
    },
    async logout() {
      await request('/auth/logout', { method: 'POST' });
    },
  };
}

export function getGoogleCallbackUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}/auth/google/callback`;
}
