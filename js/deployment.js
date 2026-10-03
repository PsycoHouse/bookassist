const PRODUCTION_ORIGIN = 'https://bookassist.gamer-33.workers.dev';

/**
 * GitHub Pages can only serve the static files and cannot handle the authenticated
 * API routes. Send old/bookmarked Pages URLs to the Worker, which serves both the
 * UI and the API from the same origin so its secure session cookie works.
 */
export function redirectFromStaticHosting(location = window.location) {
  if (!location.hostname.endsWith('.github.io')) return false;

  const page = location.pathname.split('/').filter(Boolean).at(-1);
  const pathname = page === 'app.html' || page === 'login.html' ? `/${page}` : '/';
  location.replace(`${PRODUCTION_ORIGIN}${pathname}${location.search}${location.hash}`);
  return true;
}
