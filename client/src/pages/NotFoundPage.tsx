import { ButtonLink } from '../components/ui/ButtonLink';
import { useLanguage } from '../hooks/useLanguage';

export function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-semibold text-leaf-600">404</p>
      <h1 className="mt-2 text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-3 text-soil-600">{t('notFound.message')}</p>
      <div className="mt-6">
        <ButtonLink to="/">{t('notFound.home')}</ButtonLink>
      </div>
    </section>
  );
}
