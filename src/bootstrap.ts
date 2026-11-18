import {
  RequestMethod,
  StandardSchemaValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from './config/environment.schema.js';

export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService<Environment, true>);
  const frontendUrl = config.get('FRONTEND_URL', { infer: true });

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: frontendUrl, credentials: true });
  app.enableCsrfProtection({
    trustedOrigins: [frontendUrl],
    exclude: [
      {
        path: 'auth/google/callback',
        method: RequestMethod.POST,
      },
    ],
  });
  app.useSecurityHeaders();
  app.useGlobalPipes(new StandardSchemaValidationPipe());
}
