import { describe, expect, it } from 'vitest';
import {
  AuthenticationHttpError,
  toSafeAuthenticationError,
  translateCallbackError,
} from './auth-errors.js';

describe('translateCallbackError', () => {
  it('translates known and unknown callback codes without exposing them', () => {
    expect(translateCallbackError('google_email_not_verified')).toContain(
      'e-mail verificado',
    );
    expect(translateCallbackError('sensitive_external_code')).toBe(
      'Não foi possível concluir o acesso com Google. Tente novamente.',
    );
  });
});

describe('toSafeAuthenticationError', () => {
  it('maps authorization and server errors to actionable messages', () => {
    expect(
      toSafeAuthenticationError(new AuthenticationHttpError(401, null)),
    ).toContain('sessão expirou');
    expect(
      toSafeAuthenticationError(new AuthenticationHttpError(503, null)),
    ).toContain('temporariamente indisponível');
  });
});
