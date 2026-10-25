# ReefMetric competitor audit — 2026-10-25

This review fetched four live sites found in web results for “reef calculator,” “reef aquarium calculator salt mixing sump volume guide,” and “return pump calculator reef tank head loss guide.” Search presence is observed; Google rank, search volume, traffic, clicks and revenue were not measured. All four main pages were opened twice; the features below appeared both times. This is a content/interface review, not verification that their formulas or product claims are right. No competitor product facts were copied into ReefMetric.

## Four live comparisons

| Site and fetched URL | What a keeper gets | Gap against the current ReefMetric source |
|---|---|---|
| [reefcalcs](https://reefcalcs.com/) and [salt mix](https://reefcalcs.com/calculators/salt-mix/) | A formula beside the result, chemistry/setup/equipment groups, salt mixing, evaporation and sump-baffle tools, dated corrections, and buying links near the relevant result. The salt tool accepts volume and target salinity and displays dry salt weight. | ReefMetric already has methods and equipment rankings; it lacks a dry-salt batch tool, evaporation/ATO reserve planning and a correction log. Its salt COST page is a different job. Do not copy reefcalcs's salinity approximations, care advice, product constants or accuracy claims without primary checks. |
| [Frags2Fishes](https://frags2fishes.com/aquarium-calculators/) | Searchable tool index; groups for setup, chemistry and upkeep; salt mixing, salinity swap, RO/DI output and media tools. Its FAQ describes unit switching and carrying system volume between tools. | ReefMetric has a short unfiltered tool list, does not carry tank volume between pages, and lacks the mixing/swap/output tools. The source claims reuse and metric behavior; this review did not execute those features. |
| [Bulk Reef Supply return-pump guide](https://www.bulkreefsupply.com/content/post/how-to-size-a-return-pump) | A signed, dated guide; diagrams; distinction between return and in-tank flow; examples; drain-capacity warning; nearby equipment links. It explains consulting the maker's flow graph. | ReefMetric has its own stronger explicit plumbing model and equipment shortlist, but has no standalone illustrated guide to reading a pump curve. Its author identity remains an owner decision, never an invented credential. BRS's rules of thumb are not substitutes for ReefMetric's model. |
| [Reef Bench flow calculator](https://www.reefbench.co.uk/calculators/return-pump-head-loss) and [flow-curve guide](https://www.reefbench.co.uk/guides/read-return-pump-flow-curve) | A user-supplied manufacturer curve, interpolation example, separate friction estimate, and explicit refusal to extrapolate. Guide and calculator cross-link directly. | ReefMetric's fixed pump dataset does not accept a keeper's own manufacturer curve. The read-your-curve guide is useful; accepting arbitrary curves would expand input validation and support scope. |

## Five specific interface tactics worth retaining or adapting

1. Group tools by the task in hand: setup, water chemistry, running costs.
2. Put the worked formula beside the answer, rather than only in a distant methodology block.
3. Link the next useful action from the result: compare salt cost after mixing, or choose a dosing pump after estimating ongoing use.
4. Keep assumptions and limits visible next to the input that depends on them, including reference salinity and whether a label ratio describes starting water or final mixed volume.
5. Pair each calculator with a short guide and a worked table, so a no-JavaScript reader can still finish the basic job.

## Existing Search Console evidence, with limits

`docs/SEO_PLAN.md` stores supplied query observations, not a complete export. It gives no click counts, so a low click-through rate cannot be calculated. The report window's exact dates were not supplied. No login was used.

- “instant ocean salt calculator”: 1 impression, average position 10. The existing page intentionally answers cost, not dry salt quantity. One impression is a lead, not proof of large demand.
- “aquarium electricity cost calculator”: 4 impressions, position 14. T311 already repaired the working electricity section and its answer. Do not make a duplicate page or redo it.
- Dosing-pump terms: “reef dosing pump” 8 impressions at 28.4; “dosing pump reef” 3 at 22.3; “reef tank dosing pump” 1 at 27. Ongoing dose planning is a useful path to that existing buying page, not a claimed page-two win.
- “reef calculator”: 72 impressions at 64. T319 now routes this term to dosing; do not undo it.
- “return pumps” 14 at 26.4 and other pump terms in the twenties: useful support for better existing pump content, not evidence that a new pump page will rank.
- “faircloth skimmer sizing”: 119 at 62 refers to sediment-basin equipment, as the earlier audit established. It is not a reef content opportunity.

## Ranked additions — at most three; editorial picks, not measured forecasts

1. **Dry salt mixing calculator.** Use the reader's own label rate, its units, reference salinity and water amount; do not infer grams from “makes X gallons.” Show a worked example labeled as a mathematical example. Keep salt cost separate and link the two. It completes a missing routine task seen at both broad tool competitors and gives a direct path to the existing recurring-consumable comparison. Fetch and cite primary salt-maker mixing instructions before shipping any brand preset. This is the strongest new-page candidate.
2. **Measured daily consumption planner inside the existing dosing tool.** Use two test readings and elapsed days, with no additions/water change between readings; divide the measured drop by elapsed time, then use the existing selected supplement strength. Keep maintenance separate from the correction dose. Provide an honest no-decline/changed-conditions state and ask the reader to verify with later tests. It fills a gap already promised by ReefMetric's prose (“set a daily maintenance dose”) and supports the existing dosing-pump comparison. Do not call an inferred dose “safe” or universal.
3. **Sump drain-back reserve tool, if scope allows.** Derive drained display volume from footprint × measured water-level drop, add measured pipe/other drain-back, then compare with sump freeboard volume. Include an actual power-off test requirement and never imply this guarantees flood protection. It complements the return-pump and sump-size questions already in the brief, but has weaker query evidence and more installation assumptions, so it ranks behind the first two.

## Leave out for this pass

- A new general calculator hub, electricity page, or retargeting “reef calculator”: overlaps T311/T319.
- Fixed cleanup-crew-per-gallon recommendations and illness/coral diagnoses: require care evidence; wrong confidence can harm livestock.
- A generic controller list: the existing Apex/HYDROS/GHL comparison already owns that choice.
- New product prices or model specs based on competitor tables: primary pages are required, and retailer prices can change.
- An invented author profile, star ratings, SEO volume, traffic forecast, affiliate earnings or first-hand testing: no evidence.
- Account-backed saved tank profiles, active email signup, program approvals or analytics: violate this task's no-account/no-spend scope; local-only improvements must remain honest about current availability.
