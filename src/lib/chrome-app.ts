/** Route senza header/footer su mobile (esperienza app). */
export const APP_MOBILE_SENZA_CHROME = [
  '/hub',
  '/giri',
  '/garage',
  '/naviga',
  '/traccia',
  '/community',
];

export const APP_SEMPRE_SENZA_FOOTER = ['/naviga', '/traccia'];

export function footerNascosto(pathname: string): boolean {
  return APP_SEMPRE_SENZA_FOOTER.some((p) => pathname.startsWith(p));
}

export function chromeMobileNascosto(pathname: string, loggato: boolean): boolean {
  if (!loggato) {
    return APP_SEMPRE_SENZA_FOOTER.some((p) => pathname.startsWith(p));
  }
  return APP_MOBILE_SENZA_CHROME.some((p) => pathname.startsWith(p));
}

type PuntoNav = { lat: number; lng: number };

export function distanzaRimanenteNav<T extends PuntoNav>(
  passi: (T & { distanzaM: number })[],
  passoIdx: number,
  pos: PuntoNav,
  distanzaAlPassoFn: (pos: PuntoNav, passo: T) => number,
): number {
  if (passi.length === 0) return 0;
  const idx = Math.min(passoIdx, passi.length - 1);
  let tot = distanzaAlPassoFn(pos, passi[idx]);
  for (let i = idx + 1; i < passi.length; i++) {
    tot += passi[i].distanzaM;
  }
  return tot;
}
