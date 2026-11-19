import { FilePlus2, Files, LogOut } from 'lucide-react';
import { Brand } from '../../shared/Brand.js';
import { Spinner } from '../../shared/Spinner.js';
import { useAuthentication } from './AuthProvider.js';
import type { UserProfile } from './auth.types.js';
import { UserAvatar } from './UserAvatar.js';

interface AuthenticatedHomePageProps {
  user: UserProfile;
}

export function AuthenticatedHomePage({ user }: AuthenticatedHomePageProps) {
  const authentication = useAuthentication();

  return (
    <div className="prototype-shell">
      <aside className="prototype-sidebar">
        <Brand inverse />
        <nav aria-label="Navegação principal">
          <span className="prototype-sidebar__active">
            <Files size={18} aria-hidden="true" />
            Documentos
          </span>
        </nav>

        <div className="prototype-sidebar__profile">
          <UserAvatar user={user} />
          <span>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
          <button
            type="button"
            aria-label="Sair da conta"
            title="Sair da conta"
            disabled={authentication.isSigningOut}
            onClick={() => void authentication.logout()}
          >
            {authentication.isSigningOut ? (
              <Spinner label="Encerrando sessão" />
            ) : (
              <LogOut size={17} aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>

      <main className="documents-placeholder">
        <header>
          <h1>Documentos</h1>
          <button type="button" disabled title="Disponível na próxima etapa">
            <FilePlus2 size={17} aria-hidden="true" />
            Adicionar documento
          </button>
        </header>

        {authentication.errorMessage ? (
          <div className="inline-alert inline-alert--error" role="alert">
            <p>{authentication.errorMessage}</p>
          </div>
        ) : null}

        <section className="documents-placeholder__empty">
          <span aria-hidden="true">
            <Files size={34} strokeWidth={1.5} />
          </span>
          <h2>Você ainda não tem documentos</h2>
          <p>Os arquivos enviados aparecerão aqui.</p>
        </section>
      </main>
    </div>
  );
}
