import { ShieldCheck } from 'lucide-react';
import { Brand } from '../../shared/Brand.js';
import { Spinner } from '../../shared/Spinner.js';

export function SessionStatusPage() {
  const completingGoogle = window.location.pathname === '/auth/callback';

  return (
    <main className="session-status-page">
      <Brand />
      <div className="session-status-card" role="status" aria-live="polite">
        <span className="session-status-card__icon" aria-hidden="true">
          <ShieldCheck size={24} />
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
