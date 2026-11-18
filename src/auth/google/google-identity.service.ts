import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment.schema.js';
import type { GoogleUserProfile } from '../../users/user.js';
import {
  GOOGLE_TOKEN_VERIFIER,
  type GoogleTokenVerifier,
} from './google-token-verifier.js';

@Injectable()
export class GoogleIdentityService {
  constructor(
    @Inject(GOOGLE_TOKEN_VERIFIER)
    private readonly tokenVerifier: GoogleTokenVerifier,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async verify(credential: string): Promise<GoogleUserProfile> {
    let payload;

    try {
      const ticket = await this.tokenVerifier.verifyIdToken({
        idToken: credential,
        audience: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_GOOGLE_CREDENTIAL',
        message: 'Google credential is invalid or expired',
      });
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException({
        code: 'INVALID_GOOGLE_CREDENTIAL',
        message: 'Google credential is missing required identity claims',
      });
    }

    if (payload.email_verified !== true) {
      throw new ForbiddenException({
        code: 'GOOGLE_EMAIL_NOT_VERIFIED',
        message: 'Google account email must be verified',
      });
    }

    return {
      googleSub: payload.sub,
      name: payload.name?.trim() || payload.email,
      email: payload.email,
      avatarUrl: payload.picture ?? null,
    };
  }
}
