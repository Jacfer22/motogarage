import type { Punto } from '@/lib/geo';

/** Proietta il GPS in coordinate SVG (viewBox 0 0 100 100). */
export function tracciatoSvgPath(punti: Punto[]): { d: string; start: [number, number]; end: [number, number] } | null {
  if (punti.length < 2) return null;

  const lats = punti.map((p) => p.lat);
  const lngs = punti.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 0.0005);
  const spanLng = Math.max(maxLng - minLng, 0.0005);

  const pad = 8;
  const inner = 100 - pad * 2;
  const scale = Math.min(inner / spanLng, inner / spanLat);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const cx = 50;
  const cy = 50;

  const pts = punti.map((p) => ({
    x: cx + (p.lng - centerLng) * scale,
    y: cy + (centerLat - p.lat) * scale,
  }));

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const start = pts[0];
  const end = pts[pts.length - 1];
  return { d, start: [start.x, start.y], end: [end.x, end.y] };
}
