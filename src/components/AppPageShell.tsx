import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  /** Larghezza contenuto; hub e garage immersive possono usare `full` */
  width?: 'narrow' | 'wide' | 'full';
  /** Salta app-pagina per viste immersive già wrappate */
  immersive?: boolean;
}

const WIDTH: Record<NonNullable<Props['width']>, string> = {
  narrow: 'mx-auto max-w-2xl',
  wide: 'mx-auto max-w-6xl',
  full: '',
};

export default function AppPageShell({
  children,
  className = '',
  width = 'narrow',
  immersive = false,
}: Props) {
  const base = immersive ? '' : 'app-pagina';
  return (
    <div className={`${base} ${WIDTH[width]} px-4 pt-6 pb-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
