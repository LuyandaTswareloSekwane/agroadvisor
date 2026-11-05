import type { InputHTMLAttributes } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { translateValidationMessage } from '../../i18n';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  appearance?: 'default' | 'auth';
}

/** Labelled text input with accessible hint and error messages. */
export function TextField({ id, label, error, hint, appearance = 'default', className = '', ...rest }: TextFieldProps) {
  const { language } = useLanguage();
  const localizedError = error ? translateValidationMessage(language, error) : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = localizedError ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const inputClasses = appearance === 'auth'
    ? `mt-1 block min-h-11 w-full rounded-none border-0 border-b bg-transparent px-1 text-base text-soil-900 placeholder:text-soil-500 focus:outline-none focus:ring-0 focus-visible:border-leaf-700 ${
        localizedError ? 'border-red-600' : 'border-soil-500/80'
      }`
    : `mt-1 block min-h-11 w-full rounded-lg border bg-white px-3 text-base text-soil-900 placeholder:text-soil-300 focus:outline-none focus:ring-2 focus:ring-leaf-400 ${
        localizedError ? 'border-red-400' : 'border-soil-200'
      }`;

  return (
    <div className={className}>
      <label htmlFor={id} className={`block text-sm font-medium ${appearance === 'auth' ? 'text-soil-900' : 'text-soil-800'}`}>
        {label}
      </label>
      <input
        id={id}
        className={inputClasses}
        aria-invalid={localizedError ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && !localizedError && (
        <p id={hintId} className="mt-1 text-xs text-soil-500">
          {hint}
        </p>
      )}
      {localizedError && (
        <p id={errorId} className="mt-1 text-xs font-medium text-red-700">
          {localizedError}
        </p>
      )}
    </div>
  );
}
