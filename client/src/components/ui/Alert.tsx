import type { ReactNode } from 'react';

type AlertTone = 'error' | 'warning' | 'info';

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}

const toneClasses: Record<AlertTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-wheat-400 bg-wheat-100 text-soil-800',
  info: 'border-leaf-200 bg-leaf-50 text-leaf-900',
};

export function Alert({ tone = 'info', title, children }: AlertProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${toneClasses[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? 'mt-1' : undefined}>{children}</div>
    </div>
  );
}
