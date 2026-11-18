import type { GoogleUserProfile, User } from './user.js';

export abstract class UsersRepository {
  abstract findById(id: string): User | null | Promise<User | null>;
  abstract upsertGoogleProfile(
    profile: GoogleUserProfile,
  ): User | Promise<User>;
}
