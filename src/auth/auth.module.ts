import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@nestjs/authentication';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { Environment } from '../config/environment.schema.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleAuthRedirectService } from './google/google-auth-redirect.service.js';
import { GOOGLE_IDENTITY_ORIGIN } from './google/google.constants.js';
import { GoogleCsrfService } from './google/google-csrf.service.js';
import { GoogleIdentityService } from './google/google-identity.service.js';
import {
  GOOGLE_TOKEN_VERIFIER,
  type GoogleTokenVerifier,
} from './google/google-token-verifier.js';
import { PostgresSessionStore } from './postgres-session.store.js';
import { SessionAuthProvider } from './session-auth.provider.js';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    AuthenticationModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => {
        const isProduction =
          config.get('NODE_ENV', { infer: true }) === 'production';

        return {
          session: {
            absoluteTtl: '7d' as const,
            idleTtl: '1d' as const,
            trustedOrigins: [
              config.get('FRONTEND_URL', { infer: true }),
              GOOGLE_IDENTITY_ORIGIN,
            ],
            cookie: {
              secure: isProduction,
              sameSite: 'lax' as const,
              path: '/',
            },
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleAuthRedirectService,
    GoogleCsrfService,
    GoogleIdentityService,
    PostgresSessionStore,
    SessionAuthProvider,
    {
      provide: GOOGLE_TOKEN_VERIFIER,
      useFactory: (): GoogleTokenVerifier => new OAuth2Client(),
    },
  ],
})
export class AuthModule {}
