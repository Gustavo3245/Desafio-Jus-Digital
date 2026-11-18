import type { LoginTicket, VerifyIdTokenOptions } from 'google-auth-library';

export const GOOGLE_TOKEN_VERIFIER = Symbol('GOOGLE_TOKEN_VERIFIER');

export interface GoogleTokenVerifier {
  verifyIdToken(options: VerifyIdTokenOptions): Promise<LoginTicket>;
}
