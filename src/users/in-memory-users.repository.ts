import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { GoogleUserProfile, User } from './user.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class InMemoryUsersRepository extends UsersRepository {
  private readonly usersById = new Map<string, User>();
  private readonly userIdByGoogleSub = new Map<string, string>();

  findById(id: string): User | null {
    return this.usersById.get(id) ?? null;
  }

  upsertGoogleProfile(profile: GoogleUserProfile): User {
    const existingId = this.userIdByGoogleSub.get(profile.googleSub);
    const existing = existingId ? this.usersById.get(existingId) : undefined;
    const now = new Date();

    if (existing) {
      const updated: User = {
        ...existing,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        updatedAt: now,
      };
      this.usersById.set(updated.id, updated);
      return updated;
    }

    const created: User = {
      id: randomUUID(),
      ...profile,
      createdAt: now,
      updatedAt: now,
    };
    this.usersById.set(created.id, created);
    this.userIdByGoogleSub.set(created.googleSub, created.id);
    return created;
  }
}
