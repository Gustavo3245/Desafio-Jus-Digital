import { LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { Brand } from '../../shared/Brand.js';
import { GoogleSignInButton } from './GoogleSignInButton.js';

interface LoginPageProps {
  errorMessage?: string | null;
  onRetry: () => void;
}

export function LoginPage({ errorMessage, onRetry }: LoginPageProps) {
  return (
    <main className="login-layout">
      <section className="login-story" aria-labelledby="login-story-title">
        <Brand inverse />

        <div className="login-story__content">
          <span className="eyebrow eyebrow--inverse">
            <Sparkles size={16} aria-hidden="true" />
            Documentos e IA, em um só lugar
          </span>
          <h1 id="login-story-title">
            Seus documentos, com respostas mais claras.
          </h1>
          <p>
            Envie, organize e analise documentos com IA em um ambiente privado e
            simples de usar.
          </p>
        </div>

        <DocumentLayers />

        <p className="login-story__footnote">
          <ShieldCheck size={18} aria-hidden="true" />
          Seus arquivos permanecem associados somente à sua conta.
        </p>
      </section>

      <section className="login-access" aria-labelledby="login-access-title">
        <div className="login-access__mobile-brand">
          <Brand />
        </div>

        <div className="login-card">
          <span className="login-card__icon" aria-hidden="true">
            <LockKeyhole size={22} />
          </span>
          <p className="eyebrow">Acesso seguro</p>
          <h2 id="login-access-title">Boas-vindas</h2>
          <p className="login-card__description">
            Use sua conta Google para acessar seus documentos e análises.
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

          <div className="privacy-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <p>O acesso aos arquivos é privado e associado à sua conta.</p>
          </div>
        </div>

        <p className="login-access__legal">
          Ao continuar, você autoriza apenas os dados básicos necessários para
          identificar sua conta.
        </p>
      </section>
    </main>
  );
}

function DocumentLayers() {
  return (
    <div className="document-art" aria-hidden="true">
      <div className="document-art__sheet document-art__sheet--back">
        <span />
        <span />
        <span />
      </div>
      <div className="document-art__sheet document-art__sheet--middle">
        <span />
        <span />
        <span />
      </div>
      <div className="document-art__sheet document-art__sheet--front">
        <i>
          <Sparkles size={18} />
        </i>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
