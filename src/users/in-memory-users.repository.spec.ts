import { InMemoryUsersRepository } from './in-memory-users.repository.js';

describe('InMemoryUsersRepository', () => {
  it('creates and then updates the same Google identity', () => {
    const repository = new InMemoryUsersRepository();
    const created = repository.upsertGoogleProfile({
      googleSub: 'google-subject',
      name: 'Initial Name',
      email: 'initial@example.com',
      avatarUrl: null,
    });

    const updated = repository.upsertGoogleProfile({
      googleSub: 'google-subject',
      name: 'Updated Name',
      email: 'updated@example.com',
      avatarUrl: 'https://example.com/avatar.png',
    });

    expect(updated.id).toBe(created.id);
    expect(updated).toMatchObject({
      name: 'Updated Name',
      email: 'updated@example.com',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });
});
