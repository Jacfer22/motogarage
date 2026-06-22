type Variante = 'header' | 'footer' | 'hero' | 'icon' | 'card' | 'compact';

const DIMENSIONI: Record<Variante, string> = {
  header: 'h-10 w-auto sm:h-11',
  compact: 'h-8 w-auto sm:h-9',
  footer: 'h-14 w-auto',
  hero: 'h-28 w-auto sm:h-36',
  icon: 'h-14 w-auto',
  card: 'h-20 w-auto',
};

export default function Logo({
  variante = 'header',
  className = '',
}: {
  variante?: Variante;
  className?: string;
}) {
  return (
    <img
      src="/logo-motogarage.png"
      alt="MotoGarage — La casa digitale della tua moto"
      className={`object-contain ${DIMENSIONI[variante]} ${className}`}
      width={variante === 'header' ? 160 : 280}
      height={variante === 'header' ? 48 : 120}
    />
  );
}
