import { z } from 'zod';

export const environmentSchema = z
  .object({
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
    OPENAI_API_KEY: z.string().trim().min(1, 'OPENAI_API_KEY is required'),
    OPENAI_MODEL: z.string().trim().min(1).default('gpt-4o-mini'),
    AWS_REGION: z.string().trim().min(1).default('us-east-1'),
    AWS_S3_BUCKET: z.string().trim().min(1, 'AWS_S3_BUCKET is required'),
    AWS_ACCESS_KEY_ID: z.string().trim().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().trim().optional(),
    AWS_S3_ENDPOINT: z.url().optional(),
  })
  .superRefine((env, ctx) => {
    const hasAccessKey = Boolean(env.AWS_ACCESS_KEY_ID);
    const hasSecretKey = Boolean(env.AWS_SECRET_ACCESS_KEY);

    if (hasAccessKey !== hasSecretKey) {
      ctx.addIssue({
        code: 'custom',
        path: [hasAccessKey ? 'AWS_SECRET_ACCESS_KEY' : 'AWS_ACCESS_KEY_ID'],
        message:
          'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together',
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  return environmentSchema.parse(config);
}
