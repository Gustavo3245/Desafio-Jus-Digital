import { timingSafeEqual } from 'node:crypto';
import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class GoogleCsrfService {
  assertValid(cookieToken: string | undefined, formToken: string): void {
    if (!cookieToken || !this.tokensMatch(cookieToken, formToken)) {
      throw new ForbiddenException({
        code: 'INVALID_GOOGLE_CSRF_TOKEN',
        message: 'Google sign-in request failed CSRF validation',
      });
    }
  }

  private tokensMatch(cookieToken: string, formToken: string): boolean {
    const cookieBuffer = Buffer.from(cookieToken);
    const formBuffer = Buffer.from(formToken);

    return (
      cookieBuffer.length === formBuffer.length &&
      timingSafeEqual(cookieBuffer, formBuffer)
    );
  }
}
