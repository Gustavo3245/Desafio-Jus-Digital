import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment.schema.js';
import { GoogleAuthRedirectService } from './google-auth-redirect.service.js';

describe('GoogleAuthRedirectService', () => {
  const config = {
    get: vi.fn().mockReturnValue('http://localhost:5173'),
  } as unknown as ConfigService<Environment, true>;
  const service = new GoogleAuthRedirectService(config);

  it('builds the success target from the configured frontend origin', () => {
    expect(service.success()).toEqual({
      url: 'http://localhost:5173/auth/callback',
      statusCode: 303,
    });
  });

  it('exposes only a safe failure code in the target URL', () => {
    expect(service.failure('invalid_google_credential')).toEqual({
      url: 'http://localhost:5173/auth/callback?error=invalid_google_credential',
      statusCode: 303,
    });
  });
});
