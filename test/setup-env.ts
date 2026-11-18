process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.GOOGLE_CLIENT_ID = 'google-client-id';
process.env.DATABASE_URL ??=
  'postgresql://jusdigital:jusdigital@localhost:5433/jusdigital';
