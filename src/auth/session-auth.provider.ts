import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  SessionCookieProvider,
  type SessionRecord,
} from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: User;
    session: SessionRecord;
  }
}

@Injectable()
export class SessionAuthProvider extends SessionCookieProvider<User> {
  constructor(
    private readonly users: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  protected validate(
    session: SessionRecord,
  ): User | null | Promise<User | null> {
    return this.users.findById(session.userId);
  }
}
