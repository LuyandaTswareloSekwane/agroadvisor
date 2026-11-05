import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles';

interface ButtonLinkProps {
  to: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** A router link styled as a button, for navigation actions. */
export function ButtonLink({ to, children, variant, size }: ButtonLinkProps) {
  return (
    <Link to={to} className={buttonClasses({ variant, size })}>
      {children}
    </Link>
  );
}
