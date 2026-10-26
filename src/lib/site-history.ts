/**
 * Tracks which site page the visitor was last on, so the 作物资讯 pages can send
 * them back to the exact spot they came from. Kept in memory on purpose: a fresh
 * page load has no in-app history to go back to, so nothing should be persisted.
 */
let current = "";
let previous = "";

export function rememberSiteRoute(path: string) {
  if (!path || path === current) return;
  previous = current;
  current = path;
}

export function getPreviousSiteRoute() {
  return previous;
}
