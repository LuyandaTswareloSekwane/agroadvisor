import { useCallback, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { translate } from '../i18n';

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => translate(context.language, key, values),
    [context.language],
  );

  return {
    ...context,
    t,
  };
}
