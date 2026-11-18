import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginTicket, type TokenPayload } from 'google-auth-library';
import type { Environment } from '../../config/environment.schema.js';
import { GoogleIdentityService } from './google-identity.service.js';
import type { GoogleTokenVerifier } from './google-token-verifier.js';

const validPayload: TokenPayload = {
  iss: 'https://accounts.google.com',
  aud: 'google-client-id',
  iat: 1,
  exp: 2,
  sub: 'google-subject',
  email: 'person@example.com',
  email_verified: true,
  name: 'Test Person',
  picture: 'https://example.com/avatar.png',
};

function createService(payload: TokenPayload) {
  const verifyIdToken = vi.fn().mockResolvedValue(new LoginTicket('', payload));
  const verifier: GoogleTokenVerifier = { verifyIdToken };
  const config = {
    get: vi.fn().mockReturnValue('google-client-id'),
  } as unknown as ConfigService<Environment, true>;

  return {
    service: new GoogleIdentityService(verifier, config),
    verifyIdToken,
  };
}

describe('GoogleIdentityService', () => {
  it('verifies the expected audience and maps identity claims', async () => {
    const { service, verifyIdToken } = createService(validPayload);

    await expect(service.verify('google-id-token')).resolves.toEqual({
      googleSub: 'google-subject',
      name: 'Test Person',
      email: 'person@example.com',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: 'google-client-id',
    });
  });

  it('rejects a credential that Google cannot verify', async () => {
    const { service, verifyIdToken } = createService(validPayload);
    verifyIdToken.mockRejectedValue(new Error('signature mismatch'));

    await expect(service.verify('invalid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an account with an unverified email', async () => {
    const { service } = createService({
      ...validPayload,
      email_verified: false,
    });

    await expect(service.verify('google-id-token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('uses the email as a safe display-name fallback', async () => {
    const { service } = createService({ ...validPayload, name: undefined });

    await expect(service.verify('google-id-token')).resolves.toMatchObject({
      name: 'person@example.com',
    });
  });
});
