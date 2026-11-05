import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAuthErrorMessage } from '../../services/authService';
import type { AuthProviderName } from '../../types/auth';
import { useLanguage } from '../../hooks/useLanguage';
import { Alert } from '../ui/Alert';

function ProviderMark({ provider }: { provider: AuthProviderName }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M47.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2a11.3 11.3 0 0 1-4.9 7.4l7.6 5.9c4.5-4.2 7.7-10.3 7.7-17.3Z" />
        <path fill="#34A853" d="M24 48c6.5 0 12-2.2 15.9-6l-7.6-5.9c-2.2 1.5-4.9 2.4-8.3 2.4-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48Z" />
        <path fill="#FBBC05" d="M10.5 28.6a14.4 14.4 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1Z" />
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M13 1h10v10H13z" />
      <path fill="#00a4ef" d="M1 13h10v10H1z" />
      <path fill="#ffb900" d="M13 13h10v10H13z" />
    </svg>
  );
}

export function SocialSignInOptions() {
  const { loginWithProvider, isConfigured } = useAuth();
  const { t } = useLanguage();
  const [activeProvider, setActiveProvider] = useState<AuthProviderName | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(provider: AuthProviderName) {
    setActiveProvider(provider);
    setError(null);
    try {
      await loginWithProvider(provider);
    } catch (signInError) {
      setError(getAuthErrorMessage(signInError));
    } finally {
      setActiveProvider(null);
    }
  }

  const providers: AuthProviderName[] = ['google', 'microsoft'];

  return (
    <div className="mt-5 space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-soil-500">
        <span className="h-px flex-1 bg-soil-300/80" aria-hidden="true" />
        {t('auth.orEmail')}
        <span className="h-px flex-1 bg-soil-300/80" aria-hidden="true" />
      </div>
      <div className="flex justify-center gap-3">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={!isConfigured || activeProvider !== null}
            onClick={() => void handleSignIn(provider)}
            aria-label={t(activeProvider === provider ? 'auth.providerLoading' : provider === 'google' ? 'auth.googleContinue' : 'auth.microsoftContinue')}
            aria-busy={activeProvider === provider}
            title={t(provider === 'google' ? 'auth.googleContinue' : 'auth.microsoftContinue')}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-soil-200 bg-white/85 text-soil-800 shadow-sm transition hover:border-leaf-300 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeProvider === provider ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-leaf-200 border-t-leaf-700" aria-hidden="true" />
                <span className="sr-only">{t('auth.providerLoading')}</span>
              </>
            ) : (
              <ProviderMark provider={provider} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
