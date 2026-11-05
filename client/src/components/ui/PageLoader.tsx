import { Spinner } from './Spinner';

interface PageLoaderProps {
  label?: string;
}

/** Full-section loading state used while a page's data or auth state is resolving. */
export function PageLoader({ label = 'Loading…' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-leaf-700" role="status">
      <Spinner className="h-8 w-8" />
      <span className="text-sm text-soil-600">{label}</span>
    </div>
  );
}
