import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** Shared elevated surface for grouped content across the farmer workflow. */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-soil-100 bg-white p-5 shadow-[0_8px_28px_rgba(36,37,31,0.045)] sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
