export const SEZIONI_SCHEDA_MOTO = [
  { id: 'motore', label: 'Motore & mappature', placeholder: 'Es. kit Malossi, variatore, ECU, filtro aria…' },
  { id: 'trasmissione', label: 'Catena, pignone & corona', placeholder: 'Es. DID 520, pignone 15, corona 42, corona allungata…' },
  { id: 'sospensioni', label: 'Sospensioni & freni', placeholder: 'Es. forcella revisionata, ammortizzatore, pastiglie Brembo…' },
  { id: 'scarico', label: 'Scarico & aspirazione', placeholder: 'Es. Akrapovic, Arrow, filtro sportivo…' },
  { id: 'estetica', label: 'Estetica & carena', placeholder: 'Es. cupolino, manopole, luci LED, verniciatura…' },
  { id: 'altro', label: 'Altro (la roba da veri malati)', placeholder: 'Tutto ciò che un non-biker non capirebbe…' },
] as const;

export type IdSezioneScheda = (typeof SEZIONI_SCHEDA_MOTO)[number]['id'];
export type SchedaModifiche = Partial<Record<IdSezioneScheda, string>>;

export function schedaHaContenuto(scheda: SchedaModifiche | null | undefined): boolean {
  if (!scheda) return false;
  return SEZIONI_SCHEDA_MOTO.some((s) => (scheda[s.id] ?? '').trim().length > 0);
}

export function normalizzaScheda(raw: unknown): SchedaModifiche {
  if (!raw || typeof raw !== 'object') return {};
  const out: SchedaModifiche = {};
  for (const { id } of SEZIONI_SCHEDA_MOTO) {
    const v = (raw as Record<string, unknown>)[id];
    if (typeof v === 'string' && v.trim()) out[id] = v.trim();
  }
  return out;
}
