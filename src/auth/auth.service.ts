import { Injectable } from '@nestjs/common';
import { SignInService } from '@nestjs/authentication';
import { type UserProfile, toUserProfile } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';
import { GoogleIdentityService } from './google/google-identity.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly googleIdentity: GoogleIdentityService,
    private readonly users: UsersRepository,
    private readonly signInService: SignInService,
  ) {}

  async signInWithGoogle(credential: string): Promise<UserProfile> {
    const googleProfile = await this.googleIdentity.verify(credential);
    const user = await this.users.upsertGoogleProfile(googleProfile);
    await this.signInService.signIn(user.id, { method: 'google' });
    return toUserProfile(user);
  }

  async signOut(): Promise<void> {
    await this.signInService.signOut();
  }
}
