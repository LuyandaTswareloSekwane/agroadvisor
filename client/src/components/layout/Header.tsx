import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ButtonLink } from '../ui/ButtonLink';
import { Logo } from '../ui/Logo';
import { APP_LANGUAGES, isAppLanguage, LANGUAGE_NAMES } from '../../i18n';
import { useLanguage } from '../../hooks/useLanguage';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-2 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 focus-visible:ring-offset-2 sm:px-3 ${
    isActive ? 'bg-leaf-50 text-leaf-800' : 'text-soil-600 hover:bg-soil-50 hover:text-leaf-800'
  }`;

export function Header() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-soil-100/80 bg-white/95 text-soil-900 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500"
        >
          <Logo className="h-9 w-9" />
          {/* Visually hidden on very narrow phones so the navigation fits beside the logo. */}
          <span className="sr-only text-lg font-bold tracking-tight text-leaf-900 min-[360px]:not-sr-only">
            AgroAdvisor
          </span>
        </Link>

        {!isLoading && (
          <>
            <label className="sr-only" htmlFor="language-select">
              {t('language.label')}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(event) => {
                if (isAppLanguage(event.target.value)) setLanguage(event.target.value);
              }}
              className="order-2 ml-auto min-h-10 max-w-32 rounded-lg border border-soil-200 bg-white px-2 text-sm font-medium text-soil-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 sm:order-none sm:ml-0"
            >
              {APP_LANGUAGES.map((supportedLanguage) => (
                <option key={supportedLanguage} value={supportedLanguage} className="bg-white text-soil-900">
                  {LANGUAGE_NAMES[supportedLanguage]}
                </option>
              ))}
            </select>
            <nav aria-label={t('nav.main')} className="order-3 flex w-full flex-wrap items-center justify-center gap-1 border-t border-soil-100 pt-2 sm:order-none sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2 sm:border-0 sm:pt-0">
              {user ? (
                <>
                  <NavLink to="/dashboard" className={navLinkClasses}>
                    {t('nav.dashboard')}
                  </NavLink>
                  <NavLink to="/farm" className={navLinkClasses}>
                    {t('nav.farm')}
                  </NavLink>
                  <NavLink to="/lessons" className={navLinkClasses}>
                    {t('nav.learn')}
                  </NavLink>
                  <NavLink to="/memory" className={navLinkClasses}>
                    {t('nav.memory')}
                  </NavLink>
                  <NavLink to="/community" className={navLinkClasses}>
                    {t('nav.community')}
                  </NavLink>
                  <Button variant="secondary" size="sm" onClick={handleLogout} isLoading={isLoggingOut}>
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={navLinkClasses}>
                    {t('nav.login')}
                  </NavLink>
                  <ButtonLink to="/register" size="sm">
                    {t('nav.register')}
                  </ButtonLink>
                </>
              )}
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
