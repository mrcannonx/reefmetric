# ReefMetric link and content audit — October 25, 2026

This measured public GET responses, final URLs, HTML titles, link targets, and fragment IDs. It did not measure purchases, commissions, email delivery, search gains, or manufacturer test accuracy. No form was submitted. No login was used.

## Link coverage

- Baseline live-only crawl: 130 distinct internal GET URLs, including /go query variants; zero internal HTTP failures. Forty canonical content pages were read, including the intentionally noindex cheat sheet. All 13 observed fragment links resolved.
- Expanded crawl: 199 internal GET URLs and 264 outbound URLs. It adds every calculator CTA generated through the actual affiliate helper and checked-out data, plus source/price URLs. It mixes unchanged live HTML with explicitly labelled local-data CTA possibilities; it is not a claim that local changes are deployed.
- Baseline outbound: 169 HTTP 200 results, 18 HTTP 503 Amazon responses, 18 HTTP 403 challenges, 7 HTTP 429 responses, 3 HTTP 404s, one HTTP 410, and one DNS failure. A200 alone was not treated as correct product identity.
- Full row-by-row status, final URL, title, parent URLs and redirect destinations: live-links.json and live-links-complete.json. Local final results are in local-links.json after the final build.

## Confirmed path defects and wrong-product findings

| Original URL | Reading | Local repair |
|---|---|---|
| https://aquacave.com/tunze-osmolator-3155-000-auto-top-off-system-1.html |404 Not Found; old BRS 3155 page points to a newer version | Current Osmolator 3 verified and linked; old-model image not reused. |
| https://aquacave.com/tunze-osmolator-nano-3152-000-auto-top-off-system.html |404 Not Found; old BRS 3152 page points to a newer version | Current Osmolator 3 Nano verified and linked. |
| https://aquacave.com/fluval-sea-marine-3-0-led-fixture-46w-36-48.html |404 in curl and Chromium; AquaCave homepage200 control | Parent repaired lighting sources and stopped unsupported PAR comparison. |
| https://www.royalexclusiv.com/Skimmer/Skimmer/Bubble-King-R-Double-Cone-130-300/Bubble-King-R-Double-Cone-180-RDX-DC-24V::412.html |410 in curl and Chromium | Same model sourced from Sewatec; pump footprint and water depth corrected. US price remains unknown. |
| https://coral-box.com/uploads/3/5/7/2/35728429/dca12002000300040006000900012000.pdf |curl 6: host could not resolve | Exact DCA9000 and DCA12000 model sources replaced with twice-fetched Aquarays listings. Existing maximum flow/head/watts matched. Listings specify220 V; old USD prices remain estimates. |
| https://www.bulkreefsupply.com/kessil-a160we-tuna-sun-led-light.html |200 correct title, but freshwater TunaSun spectrum | Parent excluded from reef buying recommendations. |
| https://www.bulkreefsupply.com/a360x-controllable-led-aquarium-light-tuna-sun-kessil.html |200 correct title, but freshwater TunaSun variant | Parent excluded from reef buying recommendations. |

## Retailer responses still unresolved

Amazon 503 search results are unresolved vendor responses, not proof the product URLs are permanently broken. Playwright Chromium also saw a503 search page; the Amazon homepage control returned an empty202 response. CoralVue product and homepage controls both showed a403 Cloudflare challenge in Chromium. No challenge was bypassed. HTTP 429 rows remain rate-limited reads. The final crawl retains every failure rather than hiding it.

All programs in affiliate-config.ts still have pending-approval comments and untagged destinations. The code alone cannot prove external program approval; these checked URLs show no commission attribution. No account or affiliate tag was changed.

### Every non200 baseline outbound response

| HTTP / curl | Classification | URL | Final page title |
|---|---|---|---|
| 404 / 0 | Confirmed path error | https://aquacave.com/fluval-sea-marine-3-0-led-fixture-46w-36-48.html | AquaCave.com - Not Found \| AquaCave |
| 404 / 0 | Confirmed path error | https://aquacave.com/tunze-osmolator-3155-000-auto-top-off-system-1.html | AquaCave.com - Not Found \| AquaCave |
| 404 / 0 | Confirmed path error | https://aquacave.com/tunze-osmolator-nano-3152-000-auto-top-off-system.html | AquaCave.com - Not Found \| AquaCave |
| 429 / 0 | Blocked or rate-limited; not proved dead | https://bubble-magus.net/products/bubble-magus-protein-skimmer-curve-b12 | (no HTML title) |
| 0 / 6 | DNS error; source replaced | https://coral-box.com/uploads/3/5/7/2/35728429/dca12002000300040006000900012000.pdf | (no HTML title) |
| 429 / 0 | Blocked or rate-limited; not proved dead | https://current-usa.com/products/orbit-marine-ic-led-with-app-bluetooth-control-24-to-36-inch | (no HTML title) |
| 429 / 0 | Blocked or rate-limited; not proved dead | https://eastoceansg.com/products/salifert-magnesium-profi-test | (no HTML title) |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://fluvalaquatics.com/us/shop/product/e300-electronic-heater-300w-up-to-100-us-gal-375-l | Just a moment... |
| 429 / 0 | Blocked or rate-limited; not proved dead | https://reefbreeders.com/products/photon-24-v2-pro | (no HTML title) |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://reefs.com/ai-hydra-32-led-ceiling-light-performances-and-par-analyzed-in-the-danireef-lab/ | Attention Required! \| Cloudflare |
| 429 / 0 | Blocked or rate-limited; not proved dead | https://shop.neptunesystems.com/products/a3-apex-jr-system | (no HTML title) |
| 429 / 0 | Blocked or rate-limited; not proved dead | https://shop.neptunesystems.com/products/a3-apex-system | (no HTML title) |
| 429 / 0 | Blocked or rate-limited; not proved dead | https://topshelfaquatics.com/products/octo-pulse-2-flow-pump-with-waveengine-le-controller-reef-octopus | (no HTML title) |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k= | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Coral%20Box%20DCA12000%20return%20pump | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Current%20USA%20Orbit%20Marine%20IC%20(24-36in)%20reef%20LED%20light | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=EcoTech%20Marine%20Radion%20XR15%20G6%20Pro%20reef%20LED%20light | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=EcoTech%20Marine%20Radion%20XR30%20G6%20Pro%20reef%20LED%20light | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=GHL%20Doser%203%20EXT%20dosing%20pump | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=IceCap%20K1-160%20protein%20skimmer | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Jebao%20DCP-2500%20return%20pump | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Jebao%20SLW-10%20wavemaker | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Jebao%2FJecod%20DCP-3000%20return%20pump | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Kamoer%20F4%20Pro%20dosing%20pump | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Kessil%20A160%20Tuna%20Sun%20reef%20LED%20light | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Kessil%20A360X%20Tuna%20Sun%20reef%20LED%20light | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Kessil%20AP700%20reef%20LED%20light | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Neptune%20Systems%20D%C5%8CS%20QuietDrive%20dosing%20pump | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Reef%20Angel%20Reef%20Angel%20Star | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Reef%20Breeders%20Photon%2024-V2%20Pro%20reef%20LED%20light | Sorry! Something went wrong! |
| 503 / 0 | Unresolved Amazon vendor response | https://www.amazon.com/s?k=Reef%20Octopus%20Regal%20150-SSS%20(VarioS)%20protein%20skimmer | Sorry! Something went wrong! |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/abyzz-a100-1-880gph-controllable-dc-pump | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/abyzz-a200-3-750gph-controllable-dc-pump | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/blog/coralvue-news-1/automate-water-testing-with-the-new-hydros-maven-40 | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/brands/hydros-controllers/hydros-controllers/control-starter-kits-pro-packs | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/hydros-control-x2 | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/hydros-control-x4-xp8-pro-pack | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/icecap-k1-nano-protein-skimmer | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/kamoer-f4-pro-wifi-doser | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/maxspect-turbine-duo-12k | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/maxspect-turbine-duo-9k | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/ns80-nano-skimmer | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/regal-150sss-protein-skimmer | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/regal-200sss-protein-skimmer | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/regal-250int-protein-skimmer | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/regal-250sss-protein-skimmer | Just a moment... |
| 403 / 0 | Blocked or rate-limited; not proved dead | https://www.coralvue.com/varios-10-controllable-circulation-pump | Just a moment... |
| 410 / 0 | Confirmed path error | https://www.royalexclusiv.com/Skimmer/Skimmer/Bubble-King-R-Double-Cone-130-300/Bubble-King-R-Double-Cone-180-RDX-DC-24V::412.html | (no HTML title) |

Expanded CTA-only bad rows are also preserved in live-links-complete.json. The local final crawl is authoritative for which repaired sources remain linked from this build. Old failure rows are retained as audit history.

## Changed content and factual basis

- ATO: current Osmolator 3 and3Nano replace stale3155/3152 recommendations. $249.99/$149.99 and sensors/pump lift were read twice from BRS. Individual checked dates distinguish those two refreshed rows from other dated ATO prices. Backup lists do not measure reliability or count equivalent independent overfill safeguards.
- Wavemakers: removed unsourced lifespan, noise threshold, resale, and failure-frequency claims. Cost per maximum ratedGPH remains a dated purchase-cost measure. Mount/tank-range fields replace anonymous anecdotal failure columns. Specs are linked.
- Test kits: first-purchase allocation and recurring reagent cost now have separate columns. HI772 refill $18.99 / 25=$0.76 per later test; old instrument $74.99 / 25=$3.00 was not an ongoing reagent price. Other Hanna 25-test refill sources were read twice. Salifert phosphate no longer receives an automatic phosphorus conversion; official pages provide the new cited specification links. The maker and retailer differ on phosphate test count, and this is shown.
- Salt: all 11 package/price entries have fetched sources and individual price dates. IO changed200 gallons / $74.99 to150 gallons / $68.99; TropicMarin Pro/Classic now use verified160-gallon boxes; Seachem changed unsupported160 gallons to the maker/retailer220-gallon package. Fritz maker205gal@30 ppt conflicts with retailer200gal title. Unknown and different salinity bases no longer earn a cheapest-at35 ppt ranking. Previous recorded price/yield pairs remain in each data row.
- Product/source facts and hashes: content-audit-sources.json, content-audit-salt-sources.json. Browser fallbacks: content-audit-browser-fallback.json and content-audit-salt-browser.json. Full retailer article bodies are not republished in evidence.

## Page-by-page reading

Each row names the live page and the main reader-facing issue or check. Layout, console, axe, calculator numerical QA, and screenshots are handled by the parent audit and calculator worker, not implied by this text review.

| Page | Content finding / action |
|---|---|
| / | Clear tool and guide paths. Home reliability copy needed the same correction as wavemaker review; parent owns it. |
| /about | Clear published-spec versus bench-test limit. Affiliate income wording needed conditional truth; parent owns it. |
| /compare | Useful topic hub; test-kit cost wording and noise/reliability promises needed to follow the corrected pages. |
| /compare/apex-vs-hydros-vs-ghl | Distinct kit comparison with dated prices. Absolute reliability, probe-grade, and zero-recurring-cost language flagged to parent. |
| /compare/reef-octopus-vs-nyos-vs-aquamaxx | Distinct manufacturer-rating comparison. Current-price wording over dated records and unsupported serviceability superlatives flagged. |
| /disclosure | Explains commission conditions; no star-rating or paid-placement promise was inferred as a product test. |
| /guides | Useful size/phase hub. Existing30/120 totals derive from shared rows; other totals flagged to parent. |
| /guides/120-gallon-reef-tank-setup | Footprint, floor check, space, and equipment budget are useful. Fish-fit and exact-volume wording must remain estimates. |
| /guides/30-gallon-reef-tank-setup | Clear AIO versus sump path and summed budget. Volume advice points to actual-volume calculator. |
| /guides/40-gallon-breeder-reef-tank-setup | Distinct footprint intent. Handwritten budget total needed row-sum review; parent owns it. |
| /guides/55-gallon-reef-tank-setup | Distinct narrow-footprint tradeoff. Handwritten totals and universal savings claims needed review; parent owns it. |
| /guides/75-gallon-reef-tank-setup | Distinct footprint and equipment needs. Handwritten total and universal reliability wording flagged to parent. |
| /guides/carbon-dosing | Mineral dosing is separated from nutrient export; no universal carbon dose claimed in the updated opening. Other concentration/source claims flagged for parent review. |
| /guides/dc-vs-ac-return-pumps | Shared plumbing reference and dated watts/price comparison. Model versus measured draw is explicit. |
| /guides/kalkwasser-dosing | Distinct calcium/alkalinity method. pH overdose language and unsupported unit recipes flagged to parent. |
| /how-we-rate | Explains math and source data; must avoid implying modeled flow or unlike PAR setups are measured tank results. |
| /privacy | Describes browser-only inputs, third-party images, analytics and delivery endpoint. No signup/delivery test was sent. |
| /reviews | Useful commercial hub; inherited reliability promises must match corrected review scope. |
| /reviews/best-ato | Stale Tunze models and untraceable failure anecdotes fixed locally; dated price limits retained. |
| /reviews/best-protein-skimmers | Calculator-backed tank examples and fit checks. Published versus derated ratings are identified. |
| /reviews/best-reef-dosing-pumps | Head-count and standalone-controller comparison. Old product variants and untraced reliability claims flagged to parent. |
| /reviews/best-reef-led-lighting | Wrong freshwater variants and incompatible PAR-measurement claims flagged and repaired by parent. |
| /reviews/best-reef-salt-mix | Source-backed package table replaces unsupported normalized-reef-cost ranking. |
| /reviews/best-reef-test-kits | Recurring cost and phosphorus-unit errors corrected; kit count disagreement shown. |
| /reviews/best-return-pumps | Useful actual-plumbing target and curve caveats. CoralBox failed source repaired, existing max specs matched. |
| /reviews/best-wavemakers | Cost-per-rating comparison retained; invented lifespan/reliability conclusions removed. |
| /tools | Clear tool intent and internal answer paths. Existing T319 dosing target retained by parent. |
| /tools/flow-calculator | Reader enters coral type/volume/return flow. Numeric and edge checks owned by calculator audit. |
| /tools/heater-calculator | Unsupported catastrophic-failure frequency and faulty split-heater safety phrasing flagged to calculator worker. |
| /tools/protein-skimmer-calculator | Clear load-specific versus fallback derating. Numeric/empty-state check owned by calculator worker. |
| /tools/reef-build-cost-calculator | Electricity formula and separate measured-watts inputs; prices are editorial planning allowances. |
| /tools/reef-dosing-calculator | Exact-dose and blanket-safe splitting language flagged to worker; additive sources and chemistry checked there. |
| /tools/reef-par-calculator | Incompatible light-distance readings and overconfident coral-level prediction flagged to worker/parent. |
| /tools/return-pump-calculator | Plumbing inputs and model caveat; numerical/edge checks owned by worker. |
| /tools/salinity-calculator | Linear-fit and temperature assumptions flagged to worker for method checks. |
| /tools/salt-cost-calculator | Package versus common-salinity yield basis fixed across data/review/worker; static answers read same data. |
| /tools/stocking-calculator | Heuristic score and aggression warnings are planning guidance, not guaranteed compatibility; worker checks cases. |
| /tools/tank-volume-calculator | Air/sand/rock/sump inputs give an estimate; worker checks geometry and invalid states. |
| /tools/water-change-calculator | Dilution assumes the stated replacement-water level and no new production; worker checks edge cases. |
| /cheat-sheet | Intentionally noindex public deliverable. Old lighting and budget claims need to follow corrected sources; parent owns them. |

## Limits that local code cannot settle

- No genuine user purchase, commission, email arrival, provider quota, or affiliate approval was tested. This run stays within no-email/no-account-change scope.
- Blocked retailer sources cannot prove current stock or every old recorded price. Unchanged records keep their original date; refreshed rows state their own checked date.
- Package yields with unknown salinity cannot establish a reef-salinity winner. The source gap is visible in the UI rather than silently treated as equal.
- Manufacturer specifications are not bench measurements. Owner anecdotes without traceable sources were removed from these edited reviews, not converted into frequency estimates.
- Headless Chromium fallback used a fresh public context. It did not use Desmond's signed-in Chrome or Vivaldi accounts.

## Final local result

The final crawl read196 internal GET URLs,55 fragments and384 outbound, source, and archived asset URLs. All internal URLs and fragments passed.314 outbound responses were successful and usable;57 were blocked/unresolved;13 returned HTTP errors (10 archived image URLs,3 Amazon 503);zero DNS or transport failures. No active 404 or 410 was confirmed. Every final exception, with URL, title, final URL, and next action, is listed in `local-link-exceptions.md`; full parents and timestamps remain in `local-links.json`.
