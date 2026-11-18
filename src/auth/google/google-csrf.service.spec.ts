import { ForbiddenException } from '@nestjs/common';
import { GoogleCsrfService } from './google-csrf.service.js';

describe('GoogleCsrfService', () => {
  const service = new GoogleCsrfService();

  it('accepts matching cookie and form tokens', () => {
    expect(() => service.assertValid('csrf-token', 'csrf-token')).not.toThrow();
  });

  it.each([
    ['missing cookie', undefined, 'csrf-token'],
    ['different tokens', 'cookie-token', 'form-token'],
  ])('rejects %s', (_case, cookieToken, formToken) => {
    expect(() => service.assertValid(cookieToken, formToken)).toThrow(
      ForbiddenException,
    );
  });
});
