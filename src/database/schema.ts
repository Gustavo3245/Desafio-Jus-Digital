import type { MfaState } from '@nestjs/authentication';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { DocumentStatus } from '../documents/document.js';

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  googleSub: text('google_sub').notNull().unique('users_google_sub_unique'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

export const sessionsTable = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    lastActiveAt: timestamp('last_active_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    mfa: jsonb('mfa').$type<MfaState | null>(),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const documentsTable = pgTable(
  'documents',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    instruction: text('instruction').notNull(),
    originalName: text('original_name').notNull(),
    storageKey: text('storage_key')
      .notNull()
      .unique('documents_storage_key_unique'),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    status: text('status').$type<DocumentStatus>().notNull(),
    analysis: text('analysis'),
    failureCode: text('failure_code'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('documents_user_id_created_at_idx').on(table.userId, table.createdAt),
    check('documents_size_bytes_positive_check', sql`${table.sizeBytes} > 0`),
    check(
      'documents_status_check',
      sql`${table.status} in ('processing', 'completed', 'failed')`,
    ),
    check(
      'documents_completed_analysis_check',
      sql`(${table.status} = 'completed' and ${table.analysis} is not null and btrim(${table.analysis}) <> '') or (${table.status} <> 'completed' and ${table.analysis} is null)`,
    ),
  ],
);

export const databaseSchema = {
  usersTable,
  sessionsTable,
  documentsTable,
};
