import { Difficolta } from '@/lib/types';

const COLORI: Record<Difficolta, string> = {
  facile: 'border-bosco text-bosco',
  medio: 'border-cartello text-cartello',
  impegnativo: 'border-red-700 text-red-700',
};

export function ChipDifficolta({ value }: { value: Difficolta }) {
  return <span className={`chip ${COLORI[value]}`}>{value}</span>;
}

export function ChipDato({ label, value }: { label: string; value: string }) {
  return (
    <span className="chip text-asfalto/85 dark:text-cemento/85">
      <span className="text-asfalto/65 dark:text-cemento/70">{label}</span> {value}
    </span>
  );
}
