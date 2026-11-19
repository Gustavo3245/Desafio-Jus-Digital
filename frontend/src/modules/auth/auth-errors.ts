const callbackErrors: Readonly<Record<string, string>> = {
  invalid_google_credential:
    'Não foi possível validar sua Conta Google. Tente entrar novamente.',
  google_email_not_verified:
    'Sua Conta Google precisa ter um e-mail verificado para continuar.',
};

export function translateCallbackError(code: string | null): string | null {
  if (!code) return null;

  return (
    callbackErrors[code] ??
    'Não foi possível concluir o acesso com Google. Tente novamente.'
  );
}

export function toSafeAuthenticationError(error: unknown): string {
  if (error instanceof AuthenticationHttpError) {
    if (error.status === 401) {
      return 'Sua sessão expirou. Entre novamente para continuar.';
    }

    if (error.status >= 500) {
      return 'O JusDigital está temporariamente indisponível. Tente novamente em instantes.';
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'A verificação demorou mais que o esperado. Confirme sua conexão e tente novamente.';
  }

  return 'Não foi possível verificar sua sessão. Tente novamente.';
}

export class AuthenticationHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
  ) {
    super(`Authentication request failed with status ${status}`);
    this.name = 'AuthenticationHttpError';
  }
}
