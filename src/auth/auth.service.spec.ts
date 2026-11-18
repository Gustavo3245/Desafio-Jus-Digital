import { SignInService } from '@nestjs/authentication';
import { UsersRepository } from '../users/users.repository.js';
import { AuthService } from './auth.service.js';
import { GoogleIdentityService } from './google/google-identity.service.js';

describe('AuthService', () => {
  it('verifies Google, upserts the user and creates a session', async () => {
    const googleProfile = {
      googleSub: 'google-subject',
      name: 'Test Person',
      email: 'person@example.com',
      avatarUrl: null,
    };
    const user = {
      id: 'user-id',
      ...googleProfile,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const verifyGoogle = vi.fn().mockResolvedValue(googleProfile);
    const googleIdentity = {
      verify: verifyGoogle,
    } as unknown as GoogleIdentityService;
    const upsertGoogleProfile = vi.fn().mockResolvedValue(user);
    const users = {
      upsertGoogleProfile,
    } as unknown as UsersRepository;
    const signIn = vi.fn().mockResolvedValue(undefined);
    const signInService = {
      signIn,
    } as unknown as SignInService;
    const service = new AuthService(googleIdentity, users, signInService);

    await expect(service.signInWithGoogle('credential')).resolves.toEqual({
      id: 'user-id',
      name: 'Test Person',
      email: 'person@example.com',
      avatarUrl: null,
    });
    expect(verifyGoogle).toHaveBeenCalledWith('credential');
    expect(upsertGoogleProfile).toHaveBeenCalledWith(googleProfile);
    expect(signIn).toHaveBeenCalledWith('user-id', {
      method: 'google',
    });
  });
});
