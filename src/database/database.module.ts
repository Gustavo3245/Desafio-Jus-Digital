import {
  Global,
  Inject,
  Injectable,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Environment } from '../config/environment.schema.js';
import {
  DRIZZLE_DB,
  PG_POOL,
  type DrizzleDatabase,
} from './database.constants.js';
import { databaseSchema } from './schema.js';

@Injectable()
export class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>): Pool => {
        const connectionString = config.get('DATABASE_URL', { infer: true });
        return new Pool({ connectionString });
      },
    },
    {
      provide: DRIZZLE_DB,
      inject: [PG_POOL],
      useFactory: (pool: Pool): DrizzleDatabase =>
        drizzle(pool, { schema: databaseSchema }),
    },
    DatabaseLifecycle,
  ],
  exports: [PG_POOL, DRIZZLE_DB],
})
export class DatabaseModule {}
