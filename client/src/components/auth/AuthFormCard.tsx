import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { useLanguage } from '../../hooks/useLanguage';
import { SocialSignInOptions } from './SocialSignInOptions';

interface AuthFormCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared frame for the login and registration forms. */
export function AuthFormCard({ title, subtitle, children, footer }: AuthFormCardProps) {
  const { isConfigured } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="auth-showcase relative isolate flex min-h-[calc(100dvh-8rem)] items-center justify-center overflow-hidden bg-leaf-900 px-4 py-10 sm:px-6">
      <img src="/farm-hero.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-soil-950/45 via-leaf-950/35 to-soil-950/55" aria-hidden="true" />

      <div className="w-full max-w-md">
        <Card className="glass-surface w-full rounded-2xl border border-white/60 bg-white/65 p-6 shadow-2xl shadow-soil-950/30 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-leaf-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-soil-600">{subtitle}</p>

          {!isConfigured && (
            <div className="mt-5">
              <Alert tone="warning" title={t('auth.notConfiguredTitle')}>
                {t('auth.notConfiguredBody')}
              </Alert>
            </div>
          )}

          <div className="mt-6">
            {children}
          </div>
          <SocialSignInOptions />
          <p className="mt-6 border-t border-soil-200 pt-5 text-center text-sm text-soil-700">{footer}</p>
        </Card>
      </div>
    </section>
  );
}
