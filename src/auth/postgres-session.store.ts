import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  AuthenticationStorage,
  type SessionRecord,
  type SessionStore,
} from '@nestjs/authentication';
import { ConfigService } from '@nestjs/config';
import { and, eq, lt, lte, ne } from 'drizzle-orm';
import type { Environment } from '../config/environment.schema.js';
import {
  DRIZZLE_DB,
  type DrizzleDatabase,
} from '../database/database.constants.js';
import { sessionsTable } from '../database/schema.js';

function toSessionRecord(
  row: typeof sessionsTable.$inferSelect,
): SessionRecord {
  const record: SessionRecord = {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    lastActiveAt: row.lastActiveAt,
  };

  if (row.mfa !== null) {
    record.mfa = row.mfa;
  }

  if (row.metadata !== null) {
    record.metadata = row.metadata;
  }

  return record;
}

@Injectable()
export class PostgresSessionStore implements SessionStore {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase,
    @Optional() storage?: AuthenticationStorage,
    @Optional() config?: ConfigService<Environment, true>,
  ) {
    if (storage && config?.get('NODE_ENV', { infer: true }) !== 'test') {
      storage.registerSource({ sessions: this });
    }
  }

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const [row] = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .limit(1);

    return row ? toSessionRecord(row) : undefined;
  }

  async createSession(record: SessionRecord): Promise<void> {
    await this.db.insert(sessionsTable).values({
      id: record.id,
      userId: record.userId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      lastActiveAt: record.lastActiveAt,
      mfa: record.mfa ?? null,
      metadata: record.metadata ?? null,
    });

    await this.db
      .delete(sessionsTable)
      .where(
        and(
          lte(sessionsTable.expiresAt, record.lastActiveAt),
          ne(sessionsTable.id, record.id),
        ),
      );
  }

  async touchSession(id: string, lastActiveAt: Date): Promise<void> {
    await this.db
      .update(sessionsTable)
      .set({ lastActiveAt })
      .where(
        and(
          eq(sessionsTable.id, id),
          lt(sessionsTable.lastActiveAt, lastActiveAt),
        ),
      );
  }

  async deleteSession(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .returning({ id: sessionsTable.id });

    return deleted.length > 0;
  }

  async listUserSessions(userId: string): Promise<SessionRecord[]> {
    const rows = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, userId));

    return rows.map(toSessionRecord);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
  }
}
