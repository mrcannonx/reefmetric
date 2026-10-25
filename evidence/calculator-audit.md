# Calculator audit — October 25, 2026

## What was measured

The live audit used an isolated Playwright Chromium browser and changed only calculator controls. No login, form submission, email, purchase, account change, or production write took place. `evidence/calculator-live-observations.json` records 58 live observations: three realistic cases and one edge case for all 12 original tool pages, four more each for the electricity and hydrometer-temperature sub-tools, and two additional Red Sea strength cases. External images were blocked in these math checks; the separate full-site audit owns layout, images, axe, and network errors.

The local browser check used the built site at `http://127.0.0.1:4326`, with clean URLs mapped to `.html`. `evidence/calculator-ui-audit.json` records 59 passing checks: 56 realistic/edge cases, recovery from every edge input, and three saved-stocking-plan checks (reload, corrupt data, blocked storage). The checked viewport was 390 × 844. These results prove browser event handlers and displayed outputs at those inputs, not real installed pump flow, coral PAR, heating performance, or livestock safety.

`npm run check:calculators` passed 20 source and generated-script tests. Those include independent fixed examples for all shared calculator methods, manufacturer worked dosing examples, actual dataset pump-curve/system-curve intersections, product-specific daily limits, and the existing generated cost-page event-handler check. The heater's inline method is covered by three real browser cases and an empty-input rejection.

## Defects confirmed live and fixed locally

- Red Sea Foundation liquid dose constants were wrong. At 75 US gallons, +20 ppm calcium displayed **750 mL** live; the fetched 1 mL per 100 L per 2 ppm label gives **28.3906 mL**. At the same volume, +2 dKH displayed **375 mL** live; the 1 mL per 100 L per 0.1 dKH label gives **56.7812 mL**. At 120 US gallons, +50 ppm magnesium displayed **3,000 mL in one day** live; the label gives **227.1247 mL split over at least five days** under Red Sea's 10 ppm/day limit. The old amounts are about 26.4×, 6.6×, and 13.2× those label-derived amounts. These are distinct from the manufacturer's rounded “25 gallons” shorthand; the fix uses 3.785411784 L per US gallon.
- BRS Pharma liquid constants did not match BRS's own worked examples. Soda ash changed from 0.667 to **0.714 mL per US gallon per dKH** (107.1 mL / 100 gal / 1.5 dKH). Calcium changed from 0.1 to **0.05115 mL per US gallon per ppm** (102.3 mL / 100 gal / 20 ppm). The page now names the precise new Pharma pouch/final-volume recipes.
- Seven other additive options lack a verified primary-source strength/preparation in this audit. Their records remain in `dose-data.json` with `enabled:false`; the menu offers only the five checked liquid recipes. These holds cover four dry-chemical entries, DIY magnesium stock, and two ESV components. No file or record was deleted. A current ESV page was fetched twice but did not provide the missing correction strengths.
- The dose calculation now rejects invalid, negative, nonfinite, mismatched-parameter, and disabled-additive inputs. Manufacturer notes, strength links, verification date, and correction limits appear with the answer. A valid numeric input is still not proof that a test result or chosen target is safe.
- Live PAR results mixed dry-bench fixture distances, submerged depths, and different mounting conditions, added mount height and coral depth, and held out-of-range/single-point measurements flat. The same route is now a source-curve explorer. It keeps one fixture's measurement frame, shows its conditions and points, interpolates within that curve, and returns **unknown** outside it. It does not claim a coral's real PAR or rank unlike tests.
- Empty or negative values produced believable outputs live: an empty heater room temperature became 0°F; a -1 GPH return increased required flow; negative head gave negative pump head; a 101% salt-water change was accepted; a zero-gallon tank was told it could safely dose. All existing tool number controls now share explicit empty, finite, min/max, and whole-count validation. The budget field remains optional. Invalid states show a message, clear old results, and recover on a valid edit.
- A physically impossible volume input could display “0 gal” as a volume to use for dosing. The UI now asks the reader to correct air gap, sand, and rock when they leave no display water.
- The high-salinity message incorrectly suggested evaporation as a way to lower salinity. It now explains that evaporation raises it and that replacing only evaporation restores the previous level. The converter also keeps the same reading when the user switches units and rejects an empty reading. Its conversions and glass-hydrometer temperature correction remain explicitly rough, near-reference estimates, not replacements for a calibrated instrument or manufacturer table. The correction UI limits its near-reference model to 68–86°F and rejects an empty temperature; three realistic temperatures and an edge input were checked separately.
- A half-capacity backup heater was described as keeping the tank warm after failure. The text now says it may slow cooling and may not hold target temperature alone. Unsupported “most common cause,” universal failure anecdotes, and the fixed “$30 insurance” claim were removed from this tool. No-match heater and flow states now give useful advice.
- Flow combinations of three or four units were labeled “for the pair.” The count now matches the actual combination.
- Salt package yields were ranked as equal reef-salinity value even when salinity bases differed or were unknown. The salt utility now sorts by cost only if all supplied yield salinities are known and equal. Otherwise it preserves dataset order, drops winner/rank claims, and shows package-yield notes and sources. Monthly values in that case are package-label estimates, not normalized 35-ppt cost. A separate worker refreshed source/package/price data.
- A universal “single or odd group of 5+” stocking warning contradicted bonded-pair species. It was removed; species care notes still appear. The load model is now called an editorial estimate, shows its actual formula, and avoids claiming calibration against measured real tanks.
- Sponsored tool links now say “paid link” at the click itself. A disclosure above a long list alone is not the only notice.

## One addition within this scope

The stocking plan now saves gallons, filtration, and known fish counts under the versioned browser key `reefmetric.stocking-plan.v1`. It restores a valid plan after reload, reports corrupt/unknown shapes, and keeps working when storage is blocked. No current dosing or other measured chemistry values are saved. The page says that a plan is local to this browser and is not synced; clearing browser data removes it.

## Math spot checks

| Method | Three checked realistic cases | Edge checked |
|---|---|---|
| Dose | 75 gal alk 7→9: 107.1 mL BRS, 2 days; 40 gal Ca 400→420: 40.92 mL BRS; 120 gal Mg 1250→1300: 227.1247 mL Red Sea, 5 days | 0 gallons rejected; every enabled recipe also checked against its label/example |
| Volume | 30×12×12 empty: 18.7013 gal; 40-breeder case: 42.0227 gal; 75-size case with 15-gal sump: 79.6948 gal | Air gap consumes height: visible correction message |
| Flow | 40-gal soft/LPS: 800 GPH extra; 75-gal mixed: 1937.5 extra; 120-gal SPS: 5160 extra | Negative return rejected |
| Heater | 75 gal/10°F lift: 380W rounded; 30 gal/5°F: 90W; 120 gal/18°F: 1200W | Empty room temperature rejected |
| Skimmer | 30 gal/light; 75 gal/medium; 120 gal/heavy exercised in browser; independent 150-gal headline fixture gives 150/105/75 gal | Negative budget rejected; published heavy rating overrides fallback |
| Pump | 40×5=200; 75×7=525; 120×10=1200 GPH browser targets; independent linear 1000-GPH/10-ft curve gives 1000/600/200 GPH at 0/4/8 ft with no friction | Negative head rejected; shutoff returns zero; all real operating points checked against their curve intersections |
| Salt cost | 75 gal/10% weekly: 32.25 gal/month; 40 gal/15% every 2 weeks: 12.9; 120 gal/20% monthly: 24 | 101% rejected; unlike yield bases are not ranked |
| Salinity | 35 ppt, SG 1.0264, 53 mS/cm each convert back to the stated linear anchor | Empty input gets visible message; 0 ppt source conversion classified low |
| Hydrometer correction | SG 1.025 at 77°F→1.0250; at 78°F→1.0251; at 82°F→1.0257, under the stated near-25°C linear model | Empty temperature rejected and recovers; UI limits the estimate to 68–86°F |
| Water change | 40→10 at 50%: 2 changes; 20→5 at 25%: 5; 0.2→0.05 at 20%: 7 | Zero target gets partial-dilution limit, not a finite repeated partial plan |
| Stocking | 2 clowns/40 gal: 31.5%; 4/75 gal: 33.6%; 8/120 gal/heavy: 32.3077%, using the disclosed editorial model | Negative count rejected; empty list, reload, corrupt and blocked storage checked |
| PAR source curve | Recorded Hydra points used for 12 inches=1908, 15=1185 interpolated, 21=329.5 interpolated | 30 inches outside that source returns unknown; off-coordinate single point also unknown |
| Build budget | 75-gal mid: 143W/102.96 kWh/$17.5032 electricity; 30-gal budget: 69W/49.68 kWh/$9.936; 120-gal premium: 192W/138.24 kWh/$0 at free rate | Empty rate rejected and recovers |
| Electricity sub-tool | 100W×24h×30d×$0.17: 72 kWh/$12.24; 150W×8h×30d×$0.20: 36/$7.20; 50W×24h×31d×$0.30: 37.2/$11.16 | 25h/day rejected and recovers |

## Sources and controls

- BRS liquid soda ash: https://www.bulkreefsupply.com/content/post/brs-pharma-soda-ash-mixing-and-dosing-instructions
- BRS liquid calcium: https://www.bulkreefsupply.com/content/post/brs-pharma-calcium-chloride-mixing-and-dosing-instructions
- Red Sea Foundation liquid strengths: https://redseafish.com/wp-content/uploads/2013/12/R99344_Red-Sea-Product-catalog-2017-EN.pdf
- Red Sea Foundation daily limits and preparation differences: https://redseafish.com/wp-content/uploads/2020/11/24653_Manual-Foundation-Complete-GB-_v21a-WEB.pdf
- ESV current page checked (insufficient correction-strength evidence): https://www.esvaquarium.com/
- PVC friction formula cross-check: https://parts.spearsmfg.com/sourcebook/PIPETECH_PIPE_GI_T.pdf

`evidence/dosing-source-checks.json` records two curl requests per dosing source, final status/title (or PDF type), hashes, and exact BRS example-term checks. All ten returned 200. Red Sea PDF contents were separately read with the web PDF tool; an HTTP success or PDF hash alone was not treated as proof of the facts.

`evidence/calculator-controls.json` records two failing controls on actual source files: restoring the original dosing coefficients made the recipe-example test fail; restoring held-flat PAR extrapolation made the unknown-outside-range test fail. Original final source bytes were restored in `finally` blocks and the suite passed again. The separate page-width audit owns the required oversized-element overflow control.

## Limits and next step

These are local fixes. The live defects remain until the owner reviews and deploys. No calculator can turn a rough aquarium model into measured physics or verified husbandry. Product preparation must match the exact linked source and the reader's own label. Disabled recipes must stay disabled until primary-source strength and preparation evidence is added. Browser-only saved plans need the same browser profile; there is no server account, queue, refill job, or recurring service cost. This scope spent $0 and did not push or commit.

The parent’s final built site was rechecked: 59/59 browser cases and 20/20 source/generated-script tests passed. Edge recovery also checks that no valid input retains `aria-invalid="true"`; that caught and fixed the optional-budget reset. Calculator source is frozen at this handoff.

Next: finish the parent’s whole-site browser/link review, then commit explicitly without `soul.md`; deployment stays with the Chief.
