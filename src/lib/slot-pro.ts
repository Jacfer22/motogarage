// "Slot" segnaposto per i futuri itinerari Pro, per regione.
// Non hanno nomi: nella UI appaiono completamente offuscati (vedi SlotProCard),
// servono solo a mostrare che lo spazio Pro crescerà e a raccogliere i pre-order.
// La chiave è la regione, il valore è quanti slot mostrare.
const SLOT_PER_REGIONE: Record<string, number> = {
  lazio: 2,
  toscana: 1,
  umbria: 1,
  marche: 1,
  abruzzo: 1,
};

// Quanti slot Pro mostrare per una data regione (0 se nessuno).
export function slotProRegione(slug: string): number {
  return SLOT_PER_REGIONE[slug] ?? 0;
}
