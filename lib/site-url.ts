/**
 * Absolute site origin for metadata that requires one (sitemap URLs, Open
 * Graph). Resolved at request/build time rather than hardcoded, since no
 * production domain has been assigned yet: `NEXT_PUBLIC_SITE_URL` should be
 * set once one is (e.g. in the hosting provider's env config); Vercel
 * deployments get a working default for free via `VERCEL_URL`.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
