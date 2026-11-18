import { validateEnvironment } from './environment.schema.js';

describe('validateEnvironment', () => {
  const validConfig = {
    NODE_ENV: 'development',
    PORT: '3000',
    FRONTEND_URL: 'http://localhost:5173',
    GOOGLE_CLIENT_ID: 'google-client-id',
    DATABASE_URL:
      'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital',
  };

  it('accepts valid postgres and postgresql connection URLs', () => {
    expect(validateEnvironment(validConfig)).toMatchObject({
      DATABASE_URL:
        'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital',
    });

    expect(
      validateEnvironment({
        ...validConfig,
        DATABASE_URL:
          'postgres://jusdigital:jusdigital@localhost:5433/jusdigital',
      }),
    ).toMatchObject({
      DATABASE_URL:
        'postgres://jusdigital:jusdigital@localhost:5433/jusdigital',
    });
  });

  it('rejects missing or non-PostgreSQL DATABASE_URL values', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        DATABASE_URL: undefined,
      }),
    ).toThrow(/DATABASE_URL/);

    expect(() =>
      validateEnvironment({
        ...validConfig,
        DATABASE_URL: 'http://localhost:5433/jusdigital',
      }),
    ).toThrow(/DATABASE_URL/);
  });
});
