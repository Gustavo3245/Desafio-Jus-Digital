import {
  AuthProvider,
  useAuthentication,
} from '../modules/auth/AuthProvider.js';
import { AuthenticatedHomePage } from '../modules/auth/AuthenticatedHomePage.js';
import { LoginPage } from '../modules/auth/LoginPage.js';
import { SessionStatusPage } from '../modules/auth/SessionStatusPage.js';

export function App() {
  return (
    <AuthProvider>
      <AuthenticationRoute />
    </AuthProvider>
  );
}

function AuthenticationRoute() {
  const authentication = useAuthentication();

  if (authentication.status === 'checking') return <SessionStatusPage />;
  if (authentication.status === 'authenticated' && authentication.user) {
    return <AuthenticatedHomePage user={authentication.user} />;
  }

  return (
    <LoginPage
      errorMessage={authentication.errorMessage}
      onRetry={() => void authentication.refresh()}
    />
  );
}
