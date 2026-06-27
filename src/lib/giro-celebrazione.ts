export interface GiroCelebrato {
  id: string;
  cloudId: string | null;
  nome: string;
  km: number;
  durataSec: number;
  velMediaKmh: number;
  curve: number;
  timestamp: number;
}

const CHIAVE = 'mg_giro_celebrato';

export function salvaGiroCelebrato(giro: GiroCelebrato) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(CHIAVE, JSON.stringify(giro));
}

export function leggiGiroCelebrato(): GiroCelebrato | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CHIAVE);
    if (!raw) return null;
    return JSON.parse(raw) as GiroCelebrato;
  } catch {
    return null;
  }
}

export function cancellaGiroCelebrato() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(CHIAVE);
}
