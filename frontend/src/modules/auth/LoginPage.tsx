import { FileCheck2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Brand } from '../../shared/Brand.js';
import { GoogleSignInButton } from './GoogleSignInButton.js';

interface LoginPageProps {
  errorMessage?: string | null;
  onRetry: () => void;
}

export function LoginPage({ errorMessage, onRetry }: LoginPageProps) {
  return (
    <main className="auth-layout">
      <aside className="auth-sidebar" aria-labelledby="auth-sidebar-title">
        <Brand inverse />

        <div className="auth-sidebar__content">
          <span className="auth-sidebar__icon" aria-hidden="true">
            <FileCheck2 size={32} strokeWidth={1.8} />
          </span>
          <h1 id="auth-sidebar-title">Documentos organizados e acessíveis.</h1>
          <p>
            Centralize seus arquivos e encontre as informações de que precisa.
          </p>
        </div>

        <p className="auth-sidebar__footnote">
          <ShieldCheck size={18} aria-hidden="true" />
          Ambiente seguro para seus documentos
        </p>
      </aside>

      <section className="auth-access" aria-labelledby="login-access-title">
        <div className="auth-access__mobile-brand">
          <Brand />
        </div>

        <div className="auth-card">
          <p className="auth-card__overline">Bem-vindo</p>
          <h2 id="login-access-title">Acesse sua conta</h2>
          <p className="auth-card__description">
            Entre com sua conta Google para continuar.
          </p>

          {errorMessage ? (
            <div className="inline-alert inline-alert--error" role="alert">
              <p>{errorMessage}</p>
              <button className="text-button" type="button" onClick={onRetry}>
                Tentar novamente
              </button>
            </div>
          ) : null}

          <GoogleSignInButton />

          <div className="auth-card__privacy">
            <LockKeyhole size={17} aria-hidden="true" />
            <p>Seu acesso e seus documentos são privados.</p>
          </div>
        </div>

        <p className="auth-access__legal">
          Ao continuar, usamos apenas os dados básicos da sua Conta Google para
          identificar seu acesso.
        </p>
      </section>
    </main>
  );
}
