import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { databaseSchema } from './schema.js';

export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

export type DrizzleDatabase = NodePgDatabase<typeof databaseSchema>;
