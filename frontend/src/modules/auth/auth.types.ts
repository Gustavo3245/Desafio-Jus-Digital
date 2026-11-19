export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export type AuthenticationStatus =
  'checking' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthenticationState {
  status: AuthenticationStatus;
  user: UserProfile | null;
  errorMessage: string | null;
}

export interface GoogleIdentityConfiguration {
  client_id: string;
  login_uri: string;
  ux_mode: 'redirect';
  context?: 'signin';
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

export interface GoogleButtonConfiguration {
  type: 'standard';
  theme: 'outline';
  size: 'large';
  text: 'continue_with';
  shape: 'rectangular';
  logo_alignment: 'left';
  width: number;
}

export interface GoogleIdentityApi {
  initialize(configuration: GoogleIdentityConfiguration): void;
  renderButton(
    parent: HTMLElement,
    configuration: GoogleButtonConfiguration,
  ): void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIdentityApi;
      };
    };
  }
}
