// Macro-categorie moto per il profilo utente.
// Volutamente poche e ampie: l'utente scrive poi modello/cilindrata a testo libero.
export const CATEGORIE_MOTO = [
  { value: 'naked', label: 'Naked' },
  { value: 'sportiva', label: 'Sportiva' },
  { value: 'touring', label: 'Touring / GT' },
  { value: 'adventure', label: 'Adventure / Maxi-enduro' },
  { value: 'custom', label: 'Custom / Cruiser' },
  { value: 'cafe_racer', label: 'Café Racer / Scrambler' },
  { value: 'enduro', label: 'Enduro / Cross' },
  { value: 'scooter', label: 'Scooter / Maxiscooter' },
  { value: 'vintage', label: 'Vintage / Classica' },
  { value: 'altro', label: 'Altro' },
] as const;

export type CategoriaMoto = (typeof CATEGORIE_MOTO)[number]['value'];

export function etichettaCategoria(valore: string | null): string | null {
  if (!valore) return null;
  return CATEGORIE_MOTO.find((c) => c.value === valore)?.label ?? valore;
}
