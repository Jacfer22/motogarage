/** Puntino neon rosso — marker posizione reel navigatore */
export const HTML_MARKER_NEON_REEL =
  '<div class="marker-neon-reel"><span class="marker-neon-reel-pulse"></span><span class="marker-neon-reel-core"></span></div>';

/** ~0,5s fermo all'inizio (frazione del clip), poi percorso completo lineare */
export function progressoPercorsoReel(t: number, holdFrac = 0.035): number {
  const x = Math.min(1, Math.max(0, t));
  if (x <= holdFrac) return 0;
  return (x - holdFrac) / (1 - holdFrac);
}

export type ReelFrameDetail = { frame: number; total: number };

export function tDaFrame(detail: ReelFrameDetail): number {
  if (detail.total <= 1) return 0;
  return detail.frame / (detail.total - 1);
}
