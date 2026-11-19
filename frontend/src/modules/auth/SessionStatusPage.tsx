import { Files } from 'lucide-react';
import { Brand } from '../../shared/Brand.js';
import { Spinner } from '../../shared/Spinner.js';

export function SessionStatusPage() {
  const completingGoogle = window.location.pathname === '/auth/callback';

  return (
    <main className="session-status-page" role="status" aria-live="polite">
      <div className="session-status-card">
        <Brand />
        <span className="session-status-card__icon" aria-hidden="true">
          <Files size={25} />
        </span>
        <Spinner label="Verificando sua sessão" />
        <h1>
          {completingGoogle
            ? 'Concluindo seu acesso'
            : 'Verificando sua sessão'}
        </h1>
        <p>
          {completingGoogle
            ? 'Estamos confirmando sua Conta Google com segurança.'
            : 'Só um instante enquanto preparamos seu ambiente.'}
        </p>
      </div>
    </main>
  );
}
