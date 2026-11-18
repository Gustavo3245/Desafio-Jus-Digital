process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.GOOGLE_CLIENT_ID = 'google-client-id';
process.env.DATABASE_URL ??=
  'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital';
process.env.OPENAI_API_KEY ??= 'test-openai-api-key';
process.env.OPENAI_MODEL ??= 'gpt-4o-mini';
process.env.DOCUMENT_STORAGE_DRIVER = 'memory';
process.env.AWS_REGION ??= 'us-east-1';
process.env.AWS_S3_BUCKET ??= 'jusdigital-test-bucket';
