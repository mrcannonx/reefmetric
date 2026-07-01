// Base-aware URL helper.
// import.meta.env.BASE_URL is '/reefmetric/' on the GitHub Pages preview and '/'
// locally + once we point the custom domain — so links stay correct in both places.
// Switching to reefmetric.com later just means dropping DEPLOY_BASE from the build.
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const joined = base + '/' + String(path).replace(/^\//, '');
  return joined.replace(/\/{2,}/g, '/') || '/';
}
