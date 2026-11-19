import type { GoogleIdentityApi } from './auth.types.js';

const googleScriptId = 'google-identity-services';
const googleScriptUrl = 'https://accounts.google.com/gsi/client?hl=pt-BR';
const defaultTimeoutMs = 10_000;

export async function loadGoogleIdentity(
  timeoutMs = defaultTimeoutMs,
): Promise<GoogleIdentityApi> {
  const currentApi = window.google?.accounts?.id;
  if (currentApi) return currentApi;

  const script = getOrCreateScript();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('GOOGLE_IDENTITY_TIMEOUT'));
    }, timeoutMs);

    const complete = () => {
      const api = window.google?.accounts?.id;
      if (!api) {
        cleanup();
        reject(new Error('GOOGLE_IDENTITY_UNAVAILABLE'));
        return;
      }

      cleanup();
      resolve(api);
    };

    const fail = () => {
      cleanup();
      reject(new Error('GOOGLE_IDENTITY_UNAVAILABLE'));
    };

    function cleanup() {
      window.clearTimeout(timeout);
      script.removeEventListener('load', complete);
      script.removeEventListener('error', fail);
    }

    script.addEventListener('load', complete, { once: true });
    script.addEventListener('error', fail, { once: true });
  });
}

function getOrCreateScript(): HTMLScriptElement {
  const existing = document.querySelector<HTMLScriptElement>(
    `#${googleScriptId}`,
  );
  if (existing) return existing;

  const script = document.createElement('script');
  script.id = googleScriptId;
  script.src = googleScriptUrl;
  script.async = true;
  script.defer = true;
  document.head.append(script);
  return script;
}
