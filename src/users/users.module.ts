import { Module } from '@nestjs/common';
import { InMemoryUsersRepository } from './in-memory-users.repository.js';
import { UsersRepository } from './users.repository.js';

@Module({
  providers: [
    InMemoryUsersRepository,
    { provide: UsersRepository, useExisting: InMemoryUsersRepository },
  ],
  exports: [UsersRepository],
})
export class UsersModule {}
