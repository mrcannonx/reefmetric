# Doser and kalkwasser content audit — 2026-10-25

## Defects fixed

- The dosing-pump page and kalkwasser guide said a stirring reactor was compulsory. Seachem directs users to draw clear top liquid and exclude undissolved material; a settled reservoir is a valid method. Corrected the page, FAQ/schema, shared dataset note and Guides hub description together.
- The guide said dissolved kalkwasser turns back into powder and plain water unless stirred. Replaced this explanation; removed the universal stirring requirement and slurry advice.
- The guide treated evaporation as tracking mineral demand and top-off as inherently self-limiting. Replaced this with measured-demand, daily-volume and pH/alkalinity checks. Removed unverified emergency-treatment instructions and unsupported pH setpoints.
- The Dosetronic Pro pick said five plus two additional heads (seven). Focustronic specifies five total; two can serve continuous/water-change duties. Corrected this.
- Its recorded retailer URL is the older Dosetronic, not a verified Pro quote. Kept the row, set the unverified Pro price to null, and retained its original photograph URL in `sourceImageUrl` while setting the unverified current-model photo to null.
- GHL's 0.1 mL is setting resolution, not an accuracy tolerance. Corrected that distinction and removed the cross-brand “best accuracy” ranking because common test conditions were not established.
- Replaced unsupported Wi-Fi/reliability anecdotes and complaint-frequency claims with honest verification limits. No failure rate is claimed.
- Removed the unverified 2025 bankruptcy timeline, continuing-support promise and assertion that peers are financially stable. The current developer-provided Google Play name contains `REEF FACTORY SP Z O O [ W UPADŁOŚCI ]`; the page states that exact observation and leaves future support and warranty fulfillment unverified.
- Product CTAs now say “Check price”; old prices are labeled historical, not current checkout quotes. Maker-spec links are visible for every pick.
- Removed blanket claims that every pump is suitable for every carbon-dosing liquid or kalkwasser; compatibility and duty limits must be checked.
- All five standalone and three other product records remain. No new product or rating was added.

## Sources fetched twice

Full curl final statuses, titles and claim excerpts: `evidence/doser-source-fetches.json`.

| Source | Observed support |
|---|---|
| https://redseafish.com/smart-hardware/reefdose/ | Two/four heads, maker accuracy ±0.05 mL and 0.1 mL daily setting steps. Both curl fetches 200 with matching ReefDose title. |
| https://www.aquariumcomputer.com/products/ghl-doser/ghl-doser-3/ | 0.1 mL resolution; standalone/extension distinction; Wi-Fi/LAN/USB. Both 200, correct GHL Doser 3 title. |
| https://focustronic.com/dosetronic/ | Pro has five pumps; two handle continuous/water-change work. Overview lists 0.1 mL accuracy and resolution. Both 200, correct Dosetronic title. |
| https://store.reeffactory.com/en/smart-devices/240-smart-feeder-5904610542231.html | Four heads in included contents and ±0.01 mL maker accuracy. Both curl fetches 200, title Dosing pump Pro X4 despite misleading path name. |
| https://www.neptunesystems.com/dos/ | Requires A2 or A3 Series Apex. Both 200, correct DŌS title. |
| https://play.google.com/store/apps/details?id=com.reeffactory.smartreef&hl=en | Exact developer-provided name with `[ W UPADŁOŚCI ]` reproduced. Both 200, title Smart Reef - Apps on Google Play. This is not a court-record lookup or a test of support service. |
| https://seachem.com/reef-kalkwasser.php | Maker instructions require clear top liquid, no solids, covered container and pH/alkalinity monitoring. Both 200, correct Seachem Reef Kalkwasser title. Its example mixing recipe is labeled for that product, not a tank dose. |
| https://coralvue.com/kamoer-f4-pro-wifi-doser | Both curl fetches returned 403 with “Just a moment...” title; web page also failed. No current discontinuation/stock claim is made from the old note. |

Original retailer product pages were also fetched twice and returned 200 with matching titles. Their old recorded prices were not refreshed or described as live quotes.

## Verification scope

Build and final all-site checks are recorded by the parent audit. This patch changes static content and dataset fields, not a dosing engine. No IDs were added to the comparison table; product pick IDs remain one per product. Final rendered duplicate-ID/FAQ/schema checks and mobile screenshots are required before the parent commits.
