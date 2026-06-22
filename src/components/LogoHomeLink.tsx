'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { homeHref } from '@/lib/home-href';
import Logo from '@/components/Logo';

interface Props {
  variant?: 'header' | 'floating';
  onClick?: () => void;
  className?: string;
}

export default function LogoHomeLink({ variant = 'header', onClick, className = '' }: Props) {
  const { user, loading, nonConfigurato } = useAuth();
  const loggato = !loading && !!user && !nonConfigurato;
  const href = homeHref(loggato);
  const floating = variant === 'floating';

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={loggato ? 'Torna al tuo hub MotoGarage' : 'Torna alla home MotoGarage'}
      className={`logo-home-link tap ${floating ? 'logo-home-link--floating' : 'logo-home-link--header'} ${className}`}
    >
      <span className="logo-home-link-mark">
        <Logo variante={floating ? 'compact' : 'header'} className="logo-home-link-img" />
      </span>
      <span className={`logo-home-link-text ${floating ? 'logo-home-link-text--floating' : ''}`}>
        Moto<span className="text-brand">Garage</span>
      </span>
    </Link>
  );
}
