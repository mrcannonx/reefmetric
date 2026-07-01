# ReefMetric

**We measure reef gear so you don't have to guess.** A data-driven affiliate site for saltwater aquarium keepers — reviews, comparison databases, and calculators for protein skimmers, return pumps, reef lighting, controllers, and full reef builds.

Site #1 of the PLAYRIOT Affiliate Department. Built to the department doctrine: rankability-first, high-ticket/recurring where possible, **unique-per-URL (original data + tools, not thin listicles)**, and own-the-audience (email from day one).

## Why this niche (validated)
- **Rankable:** independent affiliate sites already rank #1–3 for reef buyer terms; **no big-media testing authority walls the SERP** (unlike cold plunge → Garage Gym Reviews). Bulk Reef Supply is present but never dominates.
- **The moat:** reef gear can't be hand-tested at scale, so we win with **original data + interactive tools** (skimmer-by-tank-size database, flow/cost calculators) that capture the size/setup long-tail forums own with zero optimized content — and that AI Overviews can't summarize away.
- **Economics:** thinner per-sale than some niches (premium brands are dealer-direct-only → ~3% via retailers like BRS), so this is a **volume + email-list play**, not a high-ticket jackpot.

## Stack
- **Astro** (static output) → best Core Web Vitals, deploys free to **Cloudflare Pages**.
- `@astrojs/sitemap` for the sitemap (search + AI crawlers).
- Minimal client JS. Brand: reef-teal + coral, Space Grotesk display.

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
1. **Register `reefmetric.com`** (run the USPTO trademark check first).
2. **Cloudflare Pages** account (free) → connect repo → auto-deploy `dist`.
3. **Analytics:** GA4 + Google Search Console (Domain property) + Bing Webmaster (ChatGPT rides Bing's index).
4. **Affiliate programs** (apply under the owner's name/tax info): Bulk Reef Supply (Impact), Amazon Associates, Chewy, Aquarium Specialty, SaltwaterAquarium.com — see the build brief for order + rates.
5. **Email:** Kit (ConvertKit) or Beehiiv → wire the `EmailCapture` form + the "Reef Gear Cheat Sheet" lead magnet.
6. **Consent:** CMP with Consent Mode v2 (EU) + GPC (US).

## Status
Foundation scaffolded. Next: the first tool (Skimmer Finder or Return Pump Calculator), the opening content cluster, and the `/go/` affiliate redirect layer — per `../<scratchpad>/reef-build-brief.md`.
