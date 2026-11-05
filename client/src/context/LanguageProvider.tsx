import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { APP_LANGUAGES, isAppLanguage, type AppLanguage } from '../i18n';
import { LanguageContext } from './LanguageContext';

const languageStorageKey = 'agroadvisor-language';

function getInitialLanguage(): AppLanguage {
  const savedLanguage = window.localStorage.getItem(languageStorageKey);
  if (savedLanguage && isAppLanguage(savedLanguage)) return savedLanguage;

  const browserLanguage = navigator.language.toLowerCase().split('-')[0];
  return APP_LANGUAGES.find((language) => language === browserLanguage) ?? 'en';
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  function setLanguage(nextLanguage: AppLanguage) {
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    setLanguageState(nextLanguage);
  }

  useEffect(() => {
    document.documentElement.lang = language === 'zu' ? 'zu' : language;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
