import { validateEnvironment } from './environment.schema.js';

describe('validateEnvironment', () => {
  const validConfig = {
    NODE_ENV: 'development',
    PORT: '3000',
    FRONTEND_URL: 'http://localhost:5173',
    GOOGLE_CLIENT_ID: 'google-client-id',
    DATABASE_URL:
      'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital',
    AWS_REGION: 'sa-east-1',
    AWS_S3_BUCKET: 'jusdigital-documents',
  };

  it('accepts valid PostgreSQL and AWS S3 configuration', () => {
    expect(validateEnvironment(validConfig)).toMatchObject({
      DATABASE_URL:
        'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital',
      AWS_REGION: 'sa-east-1',
      AWS_S3_BUCKET: 'jusdigital-documents',
    });

    expect(
      validateEnvironment({
        ...validConfig,
        DATABASE_URL:
          'postgres://jusdigital:jusdigital@localhost:5433/jusdigital',
        AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
        AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      }),
    ).toMatchObject({
      DATABASE_URL:
        'postgres://jusdigital:jusdigital@localhost:5433/jusdigital',
      AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
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

  it('rejects missing AWS_S3_BUCKET or incomplete static AWS credentials', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        AWS_S3_BUCKET: '',
      }),
    ).toThrow(/AWS_S3_BUCKET/);

    expect(() =>
      validateEnvironment({
        ...validConfig,
        AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
      }),
    ).toThrow(/AWS_SECRET_ACCESS_KEY/);
  });
});
