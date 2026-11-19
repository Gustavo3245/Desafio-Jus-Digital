import { z } from 'zod';

const s3BucketNameSchema = z
  .string()
  .trim()
  .min(3, 'AWS_S3_BUCKET must contain a bucket name')
  .max(63, 'AWS_S3_BUCKET must contain a bucket name')
  .regex(
    /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/,
    'AWS_S3_BUCKET must be a bucket name, not an ARN or s3:// URL',
  )
  .refine((name) => !name.includes('..'), {
    message: 'AWS_S3_BUCKET must contain a valid bucket name',
  })
  .refine((name) => !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(name), {
    message: 'AWS_S3_BUCKET must contain a valid bucket name',
  });

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
    DOCUMENT_STORAGE_DRIVER: z.enum(['s3', 'memory']).default('s3'),
    AWS_REGION: z.string().trim().min(1).default('us-east-1'),
    AWS_S3_BUCKET: s3BucketNameSchema,
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

    if (
      env.NODE_ENV === 'production' &&
      env.DOCUMENT_STORAGE_DRIVER === 'memory'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['DOCUMENT_STORAGE_DRIVER'],
        message: 'In-memory document storage is forbidden in production',
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  return environmentSchema.parse(config);
}
