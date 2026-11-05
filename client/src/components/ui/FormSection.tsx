import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled group of related fields inside a larger form. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="relative isolate space-y-4 overflow-hidden rounded-2xl border border-leaf-100 bg-gradient-to-br from-white via-white to-leaf-50/70 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5">
      <div className="absolute inset-x-0 top-0 -z-10 h-1 bg-gradient-to-r from-leaf-500 via-emerald-400 to-citrus-300" aria-hidden="true" />
      <div>
        <h2 className="text-lg font-bold text-leaf-800">{title}</h2>
        {description && <p className="mt-1 text-sm text-soil-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}
