import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Environment } from '../config/environment.schema.js';
import { InMemoryUsersRepository } from './in-memory-users.repository.js';
import { PostgresUsersRepository } from './postgres-users.repository.js';
import { UsersRepository } from './users.repository.js';

@Module({
  imports: [ConfigModule],
  providers: [
    InMemoryUsersRepository,
    PostgresUsersRepository,
    {
      provide: UsersRepository,
      inject: [ConfigService, InMemoryUsersRepository, PostgresUsersRepository],
      useFactory: (
        config: ConfigService<Environment, true>,
        inMemory: InMemoryUsersRepository,
        postgres: PostgresUsersRepository,
      ): UsersRepository =>
        config.get('NODE_ENV', { infer: true }) === 'test'
          ? inMemory
          : postgres,
    },
  ],
  exports: [UsersRepository, InMemoryUsersRepository, PostgresUsersRepository],
})
export class UsersModule {}
