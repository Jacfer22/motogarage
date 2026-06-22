/** Geometria condivisa tra anteprima live e export canvas (1080×1920). */

export const CARD_LARGHEZZA = 1080;
export const CARD_ALTEZZA = 1920;
/** max-w anteprima editor — stesso riferimento del pan in px */
export const ANTEPRIMA_REF_LARGHEZZA = 300;

export interface RectTracciato {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

export const LAYOUT_MINI_FOTO = {
  leftPct: 0.07,
  topPct: 0.13,
  widthPct: 0.26,
  heightPct: 0.2,
  panSensPx: 36,
} as const;

export const LAYOUT_GRANDE = {
  leftPct: 0.12,
  topPct: 0.14,
  widthPct: 0.76,
  heightPct: 0.54,
  panSensPx: 40,
} as const;

/** Posizione/zoom con origin al centro — come transform CSS in anteprima. */
export function rectTracciatoConZoom(
  layout: {
    leftPct: number;
    topPct: number;
    widthPct: number;
    heightPct: number;
    panSensPx: number;
  },
  offsetX: number,
  offsetY: number,
  zoom: number,
  cardW = CARD_LARGHEZZA,
  cardH = CARD_ALTEZZA,
): RectTracciato {
  const w0 = cardW * layout.widthPct;
  const h0 = cardH * layout.heightPct;
  const panScale = cardW / ANTEPRIMA_REF_LARGHEZZA;
  const panX = (offsetX - 0.5) * layout.panSensPx * panScale;
  const panY = (offsetY - 0.5) * layout.panSensPx * panScale;
  const cx = cardW * layout.leftPct + panX + w0 / 2;
  const cy = cardH * layout.topPct + panY + h0 / 2;
  const w = w0 * zoom;
  const h = h0 * zoom;
  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
}

export function rectTracciatoMiniFoto(offsetX: number, offsetY: number, zoom: number): RectTracciato {
  return rectTracciatoConZoom(LAYOUT_MINI_FOTO, offsetX, offsetY, zoom);
}

export function rectTracciatoGrande(offsetX: number, offsetY: number, zoom: number): RectTracciato {
  return rectTracciatoConZoom(LAYOUT_GRANDE, offsetX, offsetY, zoom);
}

/** Pan in frazione di card (0–1) per CSS % — coerente con rectTracciatoConZoom. */
export function panTracciatoFrac(offset: number, panSensPx: number): number {
  return (offset - 0.5) * (panSensPx / ANTEPRIMA_REF_LARGHEZZA);
}

/** Spessore linea allineato al viewBox SVG 0–100 (snello 2.8, grande 5.5). */
export function spessoreLineaTracciato(altezzaBox: number, snello = true): number {
  const pct = snello ? 0.028 : 0.055;
  return Math.max(snello ? 4 : 6, altezzaBox * pct);
}
