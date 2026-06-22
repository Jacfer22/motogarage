export type FiltroFoto = 'none' | 'cinema' | 'caldo' | 'bw';

export type PresetLook = FiltroFoto | 'normale';

export const PRESET_LOOK: { id: PresetLook; label: string; luminosita: number; contrasto: number; saturazione: number; filtro: FiltroFoto }[] = [
  { id: 'normale', label: 'Normale', luminosita: 1, contrasto: 1, saturazione: 1, filtro: 'none' },
  { id: 'cinema', label: 'Cinema', luminosita: 0.92, contrasto: 1.18, saturazione: 0.75, filtro: 'cinema' },
  { id: 'caldo', label: 'Caldo', luminosita: 1.06, contrasto: 1.05, saturazione: 1.35, filtro: 'caldo' },
  { id: 'bw', label: 'B/N', luminosita: 1, contrasto: 1.2, saturazione: 0, filtro: 'bw' },
];

export function cssFiltroFoto(
  luminosita: number,
  contrasto: number,
  saturazione: number,
  filtro: FiltroFoto,
): string {
  const base = `brightness(${luminosita}) contrast(${contrasto}) saturate(${saturazione})`;
  if (filtro === 'cinema') return `${base} sepia(0.08)`;
  if (filtro === 'caldo') return `${base} sepia(0.22) hue-rotate(-8deg)`;
  if (filtro === 'bw') return `${base} grayscale(1)`;
  return base;
}

/** Stesso filtro usato dal canvas export */
export function filtriFotoCanvas(
  luminosita: number,
  contrasto: number,
  saturazione: number,
  filtro: FiltroFoto,
): string {
  const base = `brightness(${luminosita}) contrast(${contrasto}) saturate(${saturazione})`;
  if (filtro === 'cinema') return `${base} saturate(0.75) contrast(1.18) brightness(0.92)`;
  if (filtro === 'caldo') return `${base} sepia(0.22) saturate(1.35) brightness(1.06)`;
  if (filtro === 'bw') return `${base} grayscale(1) contrast(1.2)`;
  return base;
}
