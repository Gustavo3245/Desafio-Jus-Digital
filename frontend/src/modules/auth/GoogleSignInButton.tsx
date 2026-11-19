import { useEffect, useRef, useState } from 'react';
import { getGoogleCallbackUrl } from './auth-api.js';
import { loadGoogleIdentity } from './google-identity.js';

type GoogleButtonState = 'loading' | 'ready' | 'error' | 'unconfigured';

export function GoogleSignInButton() {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GoogleButtonState>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const target = container.current;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!target) return;

    if (!clientId) {
      setState('unconfigured');
      return;
    }

    let active = true;
    setState('loading');
    target.replaceChildren();

    void loadGoogleIdentity()
      .then((googleIdentity) => {
        if (!active) return;

        googleIdentity.initialize({
          client_id: clientId,
          ux_mode: 'redirect',
          login_uri: getGoogleCallbackUrl(import.meta.env.VITE_API_BASE_URL),
          context: 'signin',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        googleIdentity.renderButton(target, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(400, Math.max(240, target.clientWidth)),
        });
        setState('ready');
      })
      .catch(() => {
        if (active) setState('error');
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <div className="google-access">
      <div
        ref={container}
        className="google-access__button"
        aria-busy={state === 'loading'}
      />

      {state === 'loading' ? (
        <p className="google-access__status" role="status">
          Preparando acesso seguro com Google…
        </p>
      ) : null}

      {state === 'unconfigured' ? (
        <p className="inline-alert inline-alert--error" role="alert">
          O Client ID do Google ainda não foi configurado para o front-end.
        </p>
      ) : null}

      {state === 'error' ? (
        <div className="inline-alert inline-alert--error" role="alert">
          <p>Não foi possível carregar o acesso com Google.</p>
          <button
            className="text-button"
            type="button"
            onClick={() => setAttempt((current) => current + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
    </div>
  );
}
