export type ModalitaNav = 'mappa' | 'testo';

const CHIAVE = 'mg_nav_modalita';

export function leggiModalitaNav(): ModalitaNav {
  if (typeof localStorage === 'undefined') return 'mappa';
  const v = localStorage.getItem(CHIAVE);
  return v === 'testo' ? 'testo' : 'mappa';
}

export function salvaModalitaNav(modalita: ModalitaNav) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CHIAVE, modalita);
}
