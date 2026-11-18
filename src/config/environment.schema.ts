import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().trim().min(1, 'GOOGLE_CLIENT_ID is required'),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: 'DATABASE_URL must be a valid PostgreSQL connection URL',
  }),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  return environmentSchema.parse(config);
}
