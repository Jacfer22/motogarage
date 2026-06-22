/** Home dopo login = cockpit personale; altrimenti landing pubblica. */
export function homeHref(loggato: boolean): string {
  return loggato ? '/hub' : '/';
}
