export type ButtonVariant = 'primary' | 'secondary' | 'inverse';
export type ButtonSize = 'sm' | 'md';

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-400 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-leaf-700 text-white shadow-sm hover:bg-leaf-800 hover:shadow',
  secondary: 'border border-soil-200 bg-white text-soil-800 hover:border-soil-300 hover:bg-soil-50',
  // For use on dark green surfaces (header, hero).
  inverse: 'bg-wheat-50 text-leaf-800 hover:bg-wheat-200 focus-visible:ring-offset-leaf-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-5 text-sm',
};

/** Shared class list so <Button> and <ButtonLink> always look identical. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: ButtonStyleOptions = {}): string {
  return [baseClasses, variantClasses[variant], sizeClasses[size], fullWidth ? 'w-full' : '']
    .filter(Boolean)
    .join(' ');
}
