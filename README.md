# ReefMetric

Reef-aquarium sizing tools, equipment comparisons, and setup guides. Tools use published specifications and stated estimates; the site does not claim first-hand bench testing.

## Run and check

Use Node 22, matching `.github/workflows/deploy.yml`.

```bash
npm ci
```

```bash
npm run build
```

```bash
npm run check:seo
```

```bash
npm run check:calculators
```

```bash
npm run check:salt-mix
```

The build emits flat `.html` files. This preview maps clean URLs to those files with the right content types. A plain directory server gives false missing-page and layout failures.

```bash
npm run serve:built
```

Install the free local QA browser once:

```bash
npx playwright install chromium
```

With the preview running, run layout checks at 320, 375, 390, 768, and 1440 pixels, plus axe accessibility and browser errors. Set `SCREENSHOTS=1` to capture all rendered pages at 390 and 1440. The script blocks email POSTs and analytics; it does not log in or send email.

```bash
SCREENSHOTS=1 node scripts/audit-browser.mjs http://127.0.0.1:4326 local-final
```

```bash
node scripts/audit-calculator-ui.mjs
```

```bash
SALT_MIX_BROWSER_URL=http://127.0.0.1:4326 npm run check:salt-mix
```

```bash
python3 scripts/audit-links.py --origin http://127.0.0.1:4326 --data-sources --output evidence/local-links
```

## Data and images

`src/data/` contains recorded specifications and prices. A page revision date does not refresh all product facts. Some source sites block automated checks; records must say when facts remain unverified. Salt package yields with different salinity bases are not ranked as equal reef gallons. PAR readings keep their own test setup; the explorer does not predict coral-depth PAR in another tank.

Dosing enables only the liquid concentrations checked against the cited instructions. Other recorded options remain disabled. Match the exact product and concentration, use real water volume, and re-test before further dosing.

Product thumbnails are local 256-pixel WebP files. The refresh script retains each original `sourceImageUrl`, probes image type and dimensions, and records HTTP failures in `evidence/product-images.json`. A failed image gets an honest no-photo/diagram fallback. `imageHold` prevents a known wrong-model photo from returning. Refreshing images does not verify the product specifications or price.

```bash
npm run images:refresh
```

## Current site and boundaries

There are 13 calculator pages, 8 equipment reviews, 2 comparisons, and 8 guides. The salt mixing page uses the reader's package rate. The stocking planner saves its list only in that browser; storage failures are visible. Other calculator inputs reset on reload.

Email capture already points to the factory subscribe service; the cheat sheet also has a direct browser link. This audit tests form success, retry, rate-limit, and failure views with mocked responses. Real delivery is untested because sending email is outside this task.

Affiliate approval and tags live in `src/data/affiliate-config.ts`. Pending programs and untagged retailer URLs do not prove commission attribution. No account or affiliate configuration is changed by the audit.

GitHub Pages deploys when `main` is pushed. **Do not push during local audit work.** The owner/Chief reviews the local commit before release. `soul.md` is a local instruction file and must remain uncommitted. Audit evidence is under `evidence/`; the owner report is stored in PLAYRIOT HQ.
