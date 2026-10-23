// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { copyFile } from 'node:fs/promises';

// ReefMetric — static-first affiliate site (Cloudflare Pages target).
// Doctrine: fast Core Web Vitals, flat URLs, static output, minimal client JS.
// Production/local default = root path on reefmetric.com.
// The GitHub Pages preview build overrides via env (DEPLOY_BASE=/reefmetric).
// Switching to the real domain later = just drop those env vars.
export default defineConfig({
  // Honor a harness/CI-assigned PORT for `astro dev` (preview panes bind a specific port);
  // falls through to Astro's default (4321) when unset. Dev-only — no effect on the static build.
  ...(process.env.PORT ? { server: { port: Number(process.env.PORT) } } : {}),
  site: process.env.DEPLOY_SITE || 'https://reefmetric.com',
  base: process.env.DEPLOY_BASE || '/',
  trailingSlash: 'never',
  build: { format: 'file' }, // flat /about.html → clean URLs, no 301 on static hosts
  // Keep the Astro integration as the source of the URL set. Its file-format
  // sitemap uses the bare origin for home; Base.astro uses that same canonical.
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        return !path.includes('/go/') && !path.includes('/cheat-sheet') && !path.endsWith('/404');
      },
    }),
    {
      name: 'reefmetric-sitemap-alias',
      hooks: {
        // Runs after @astrojs/sitemap, including when CI calls astro build directly.
        // Copy the real index, rather than maintaining a second sitemap by hand.
        'astro:build:done': async ({ dir }) => {
          await copyFile(new URL('sitemap-index.xml', dir), new URL('sitemap.xml', dir));
        },
      },
    },
  ],
});
