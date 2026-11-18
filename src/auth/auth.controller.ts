import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { z } from 'zod';
import { type User, type UserProfile, toUserProfile } from '../users/user.js';
import { AuthService } from './auth.service.js';

const googleSignInSchema = z.object({
  credential: z.string().trim().min(1).max(16_384),
});

type GoogleSignInRequest = z.infer<typeof googleSignInSchema>;

interface AuthenticationResponse {
  user: UserProfile;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async signInWithGoogle(
    @Body({ schema: googleSignInSchema }) body: GoogleSignInRequest,
  ): Promise<AuthenticationResponse> {
    return { user: await this.authService.signInWithGoogle(body.credential) };
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
