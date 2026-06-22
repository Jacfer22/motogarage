import Link from 'next/link';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'secondary';

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary tap',
  ghost: 'btn-ghost tap',
  danger: 'btn-danger tap',
  secondary: 'btn-ghost tap opacity-90',
};

type BaseProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = BaseProps & {
  href: string;
  onClick?: () => void;
};

function classi(variant: Variant, fullWidth?: boolean, extra?: string) {
  return [VARIANT[variant], fullWidth ? 'w-full' : '', extra].filter(Boolean).join(' ');
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  fullWidth,
  ...rest
}: ButtonProps) {
  return (
    <button type="button" className={classi(variant, fullWidth, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  children,
  className = '',
  fullWidth,
  href,
  onClick,
}: LinkProps) {
  return (
    <Link href={href} onClick={onClick} className={classi(variant, fullWidth, className)}>
      {children}
    </Link>
  );
}
