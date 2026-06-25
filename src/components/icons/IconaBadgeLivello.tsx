import type { Badge } from '@/lib/badge';
import { immagineBadge } from '@/lib/badge';

const DIMENSIONI = {
  grande: 'h-14 w-auto sm:h-16',
  compact: 'h-7 w-auto',
} as const;

type Variante = keyof typeof DIMENSIONI;

/** Badge da PNG mockup ufficiale (public/badges/). */
export default function IconaBadgeLivello({
  badge,
  size = 'grande',
  className = '',
}: {
  badge: Pick<Badge, 'id' | 'rango' | 'immagine'>;
  size?: Variante | number;
  className?: string;
}) {
  const src = badge.immagine ?? immagineBadge(badge.id);
  const classBySize = typeof size === 'number' ? '' : DIMENSIONI[size];
  const style = typeof size === 'number' ? { height: size, width: 'auto' as const } : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`object-contain ${classBySize} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}
