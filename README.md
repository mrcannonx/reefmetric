# ReefMetric

**We measure reef gear so you don't have to guess.** A data-driven affiliate site for saltwater aquarium keepers — reviews, comparison databases, and calculators for protein skimmers, return pumps, reef lighting, controllers, and full reef builds.

Site #1 of the PLAYRIOT Affiliate Department. Built to the department doctrine: rankability-first, high-ticket/recurring where possible, **unique-per-URL (original data + tools, not thin listicles)**, and own-the-audience (email from day one).

## Why this niche (validated)
- **Rankable:** independent affiliate sites already rank #1–3 for reef buyer terms; **no big-media testing authority walls the SERP** (unlike cold plunge → Garage Gym Reviews). Bulk Reef Supply is present but never dominates.
- **The moat:** reef gear can't be hand-tested at scale, so we win with **original data + interactive tools** (skimmer-by-tank-size database, flow/cost calculators) that capture the size/setup long-tail forums own with zero optimized content — and that AI Overviews can't summarize away.
- **Economics:** thinner per-sale than some niches (premium brands are dealer-direct-only → ~3% via retailers like BRS), so this is a **volume + email-list play**, not a high-ticket jackpot.

## Stack
- **Astro** (static output) → best Core Web Vitals. Currently deployed via **GitHub Pages** (`.github/workflows/deploy.yml`, custom domain via `public/CNAME`); README originally targeted Cloudflare Pages — that migration is still open (see checklist) but nothing is broken running on GH Pages today.
- `@astrojs/sitemap` for the sitemap (search + AI crawlers).
- Minimal client JS. Brand: reef-teal + coral, Space Grotesk display (self-hosted).

## Run
```bash
npm install
npm run dev      # local dev at http://localhost:4321
npm run build    # static output to ./dist
npm run preview  # preview the build
```

## Structure
- `src/layouts/Base.astro` — SEO head, Org schema, header/footer, above-the-fold FTC disclosure bar
- `src/components/` — `Disclosure` (FTC), `AffiliateButton` (rel=sponsored, cloaked), `EmailCapture`
- `src/pages/` — home + section landers (`tools`, `reviews`, `compare`, `guides`) + EEAT/legal (`about`, `disclosure`, `privacy`)
- `public/robots.txt` — AI-crawler allowlist + sitemap

## Go-live checklist (needs the owner's money / identity)
1. ~~**Register `reefmetric.com`**~~ — done, live and indexable at the apex domain.
2. **Move to Cloudflare Pages** (optional) — currently on GitHub Pages, which works fine but has no server-side redirects (the `/go/` layer is JS-only because of this) and no custom headers. Not urgent.
3. **Analytics + search consoles:** Google Search Console is verified (DNS TXT) — confirm the sitemap is submitted inside GSC. Still open: pick an analytics tool (GA4 requires shipping a real EU consent banner first; Plausible/cookieless avoids that), and verify **Bing Webmaster Tools** (one-click import from the already-verified GSC property — this is the fast path, and matters because ChatGPT/Copilot ride Bing's index).
4. **Affiliate programs** (apply under the owner's name/tax info): Bulk Reef Supply (Impact) and Aquarium Specialty first; **hold off on Amazon Associates** until real traffic exists (the account can close without 3 qualifying sales in 180 days of applying). Chewy, SaltwaterAquarium.com — see the build brief for order + rates. The `/go/` architecture means each approval is a one-line tag paste into `src/data/affiliate-config.ts`.
5. **Email:** Kit (ConvertKit) or Beehiiv → wire the `EmailCapture` form (currently an honest "coming soon" placeholder, not a dead form) + build the "Reef Gear Cheat Sheet" lead magnet from the existing datasets.
6. **Consent:** CMP with Consent Mode v2 (EU) + GPC (US) — becomes mandatory the day analytics or tagged affiliate links go live for EU/US traffic, not before.
7. **Contact inbox:** `hello@reefmetric.com` is referenced on `/privacy` — set up forwarding (Cloudflare Email Routing is free/instant if the domain's DNS is on Cloudflare) or swap the address.
8. **Author identity:** the site is currently an anonymous "we." Decide on a real public author (name, credentials, photo, `sameAs` social links) — this is an E-E-A-T signal that matters a lot for a "best X" review site and can't be faked.
9. **Distribution/backlinks:** the domain is brand-new with zero backlinks. Seed the calculators into Reef2Reef / r/ReefTank / Nano-Reef as genuine answers (not self-promo spam) under a real identity — this is the realistic path to the site's own head-term rankings, months out otherwise.

## Status
5 calculators, 6 data-driven review roundups, 1 controller comparison, 4 guides, and the `/go/` affiliate redirect layer are all live and indexable. Zero affiliate programs are approved yet, so every click currently earns $0 — that's the single blocking item, and the architecture makes activation a one-line change per program once approved. See `../<scratchpad>/reef-build-brief.md` for the original build brief.
