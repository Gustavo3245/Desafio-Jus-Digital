import {
  CheckCircle2,
  FileCheck2,
  FileText,
  LockKeyhole,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Brand } from '../../shared/Brand.js';
import { GoogleSignInButton } from './GoogleSignInButton.js';

interface LoginPageProps {
  errorMessage?: string | null;
  onRetry: () => void;
}

export function LoginPage({ errorMessage, onRetry }: LoginPageProps) {
  return (
    <main className="auth-layout">
      <div className="auth-shell">
        <aside className="auth-sidebar" aria-labelledby="auth-sidebar-title">
          <div className="auth-sidebar__content">
            <span className="auth-sidebar__icon" aria-hidden="true">
              <FileCheck2 size={32} strokeWidth={1.8} />
            </span>
            <h1 id="auth-sidebar-title">
              Documentos organizados e acessíveis.
            </h1>
            <p>
              Centralize seus arquivos e encontre as informações de que precisa.
            </p>
          </div>

          <div className="auth-visual" aria-hidden="true">
            <div className="auth-visual__document">
              <span className="auth-visual__document-icon">
                <FileText size={24} />
              </span>
              <div className="auth-visual__document-copy">
                <span />
                <span />
                <span />
              </div>
              <CheckCircle2 className="auth-visual__check" size={22} />
            </div>
            <div className="auth-visual__chip auth-visual__chip--search">
              <Search size={17} />
              Encontre em segundos
            </div>
            <div className="auth-visual__chip auth-visual__chip--secure">
              <ShieldCheck size={17} />
              Acesso protegido
            </div>
          </div>

          <p className="auth-sidebar__footnote">
            <ShieldCheck size={18} aria-hidden="true" />
            Ambiente seguro para seus documentos
          </p>
        </aside>

        <section className="auth-access" aria-labelledby="login-access-title">
          <div className="auth-access__brand">
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
            Ao continuar, usamos apenas os dados básicos da sua Conta Google
            para identificar seu acesso.
          </p>
        </section>
      </div>
    </main>
  );
}
