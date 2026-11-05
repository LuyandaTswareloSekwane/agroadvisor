import { useLanguage } from '../../hooks/useLanguage';

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="border-t border-soil-100 bg-wheat-100">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-soil-600 sm:px-6 lg:px-8">
        <p>&copy; {year} AgroAdvisor. {t('footer.credit')}</p>
      </div>
    </footer>
  );
}
