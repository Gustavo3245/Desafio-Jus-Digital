import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../database/database.constants.js';
import { usersTable } from '../database/schema.js';
import type { GoogleUserProfile, User } from './user.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class PostgresUsersRepository extends UsersRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    return row ?? null;
  }

  async upsertGoogleProfile(profile: GoogleUserProfile): Promise<User> {
    const now = new Date();
    const [row] = await this.db
      .insert(usersTable)
      .values({
        id: randomUUID(),
        googleSub: profile.googleSub,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: usersTable.googleSub,
        set: {
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          updatedAt: now,
        },
      })
      .returning();

    return row;
  }
}
