import {
  HttpStatus,
  Injectable,
  type HttpRedirectResponse,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment.schema.js';

export type GoogleAuthRedirectError =
  'google_email_not_verified' | 'invalid_google_credential';

@Injectable()
export class GoogleAuthRedirectService {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  success(): HttpRedirectResponse {
    return this.createRedirect();
  }

  failure(error: GoogleAuthRedirectError): HttpRedirectResponse {
    return this.createRedirect(error);
  }

  private createRedirect(
    error?: GoogleAuthRedirectError,
  ): HttpRedirectResponse {
    const target = new URL(
      '/auth/callback',
      this.config.get('FRONTEND_URL', { infer: true }),
    );

    if (error) {
      target.searchParams.set('error', error);
    }

    return {
      url: target.toString(),
      statusCode: HttpStatus.SEE_OTHER,
    };
  }
}
