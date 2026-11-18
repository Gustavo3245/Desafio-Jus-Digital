import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { DrizzleDatabase } from './database.constants.js';

export const DEFAULT_MIGRATIONS_FOLDER = fileURLToPath(
  new URL('../../drizzle', import.meta.url),
);

export async function runDatabaseMigrations(
  db: DrizzleDatabase,
  migrationsFolder: string = DEFAULT_MIGRATIONS_FOLDER,
): Promise<void> {
  await migrate(db, { migrationsFolder });
}
