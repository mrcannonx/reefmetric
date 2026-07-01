// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// ReefMetric — static-first affiliate site (Cloudflare Pages target).
// Doctrine: fast Core Web Vitals, flat URLs, static output, minimal client JS.
// Production/local default = root path on reefmetric.com.
// The GitHub Pages preview build overrides via env (DEPLOY_BASE=/reefmetric).
// Switching to the real domain later = just drop those env vars.
export default defineConfig({
  site: process.env.DEPLOY_SITE || 'https://reefmetric.com',
  base: process.env.DEPLOY_BASE || '/',
  trailingSlash: 'never',
  build: { format: 'file' }, // flat /about.html → clean URLs, no 301 on static hosts
  integrations: [sitemap()],
});
