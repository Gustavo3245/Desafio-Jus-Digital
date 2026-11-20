import {
  Body,
  Controller,
  Cookies,
  Get,
  HttpException,
  HttpCode,
  type HttpRedirectResponse,
  HttpStatus,
  Post,
  Req,
  Redirect,
} from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import type { Request } from 'express';
import { z } from 'zod';
import { type User, type UserProfile, toUserProfile } from '../users/user.js';
import { AuthService } from './auth.service.js';
import { GoogleAuthRedirectService } from './google/google-auth-redirect.service.js';
import { GOOGLE_IDENTITY_ORIGIN } from './google/google.constants.js';
import { GoogleCsrfService } from './google/google-csrf.service.js';

const googleSignInSchema = z.object({
  credential: z.string().trim().min(1).max(16_384),
});

type GoogleSignInRequest = z.infer<typeof googleSignInSchema>;

const googleRedirectSchema = googleSignInSchema.extend({
  g_csrf_token: z.string().trim().min(1).max(512),
});

type GoogleRedirectRequest = z.infer<typeof googleRedirectSchema>;

interface AuthenticationResponse {
  user: UserProfile;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleCsrf: GoogleCsrfService,
    private readonly googleRedirect: GoogleAuthRedirectService,
  ) {}

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async signInWithGoogle(
    @Body({ schema: googleSignInSchema }) body: GoogleSignInRequest,
  ): Promise<AuthenticationResponse> {
    return { user: await this.authService.signInWithGoogle(body.credential) };
  }

  @Public()
  @Post('google/callback')
  @Redirect()
  async completeGoogleRedirect(
    @Body({ schema: googleRedirectSchema }) body: GoogleRedirectRequest,
    @Cookies('g_csrf_token') csrfCookie: string | undefined,
    @Req() request: Request,
  ): Promise<HttpRedirectResponse> {
    this.googleCsrf.assertValid(csrfCookie, body.g_csrf_token);
    normalizeGoogleRedirectOrigin(request);

    try {
      await this.authService.signInWithGoogle(body.credential);
      return this.googleRedirect.success();
    } catch (error) {
      if (hasErrorCode(error, 'INVALID_GOOGLE_CREDENTIAL')) {
        return this.googleRedirect.failure('invalid_google_credential');
      }

      if (hasErrorCode(error, 'GOOGLE_EMAIL_NOT_VERIFIED')) {
        return this.googleRedirect.failure('google_email_not_verified');
      }

      throw error;
    }
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: User): AuthenticationResponse {
    return { user: toUserProfile(user) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(): Promise<void> {
    await this.authService.signOut();
  }
}

function normalizeGoogleRedirectOrigin(request: Request): void {
  if (
    request.headers.origin === 'null' &&
    request.headers['sec-fetch-site'] === 'cross-site'
  ) {
    request.headers.origin = GOOGLE_IDENTITY_ORIGIN;
  }
}

function hasErrorCode(error: unknown, code: string): boolean {
  if (!(error instanceof HttpException)) {
    return false;
  }

  const response = error.getResponse();
  return (
    typeof response === 'object' &&
    response !== null &&
    'code' in response &&
    response.code === code
  );
}
