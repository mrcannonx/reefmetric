// Existing size-guide budget ranges, stored as numbers so intros, tables, totals,
// and the guides hub agree. Editorial US estimates, not newly checked prices.
export interface SetupBudgetLine { item: string; budget: [number, number]; mid: [number, number]; }
export const SETUP_BUDGETS: Record<30 | 40 | 55 | 75 | 120, SetupBudgetLine[]> = {
  30: [
    { item: 'Tank + stand (30g / 29g class)', budget: [150, 280], mid: [280, 500] },
    { item: 'Filtration (HOB skimmer or AIO conversion)', budget: [100, 180], mid: [180, 350] },
    { item: 'Return/circulation pump', budget: [40, 80], mid: [80, 150] },
    { item: 'Reef light (1 fixture)', budget: [150, 250], mid: [250, 500] },
    { item: 'Powerhead(s)', budget: [50, 100], mid: [100, 200] },
    { item: 'Heater ~100–150W + controller', budget: [30, 60], mid: [60, 120] },
    { item: 'Rock (~20–30 lb) + sand (~30 lb)', budget: [60, 110], mid: [110, 200] },
    { item: 'RODI unit (or LFS water to start)', budget: [0, 120], mid: [120, 250] },
    { item: 'Salt, test kits, extras', budget: [60, 110], mid: [110, 220] },
  ],
  40: [
    { item: 'Tank + stand (40B, 36×18×16″)', budget: [200, 350], mid: [350, 600] },
    { item: 'Sump (20-long or purpose-built)', budget: [80, 150], mid: [150, 350] },
    { item: 'Return pump', budget: [60, 110], mid: [110, 200] },
    { item: 'Protein skimmer', budget: [130, 200], mid: [200, 400] },
    { item: 'Reef light(s)', budget: [200, 350], mid: [350, 700] },
    { item: 'Powerheads / flow', budget: [80, 150], mid: [150, 300] },
    { item: 'Heater + controller', budget: [30, 60], mid: [60, 140] },
    { item: 'Rock (~35 lb) + sand', budget: [70, 140], mid: [140, 250] },
    { item: 'RODI unit', budget: [80, 150], mid: [150, 250] },
    { item: 'Salt, test kits, extras', budget: [70, 130], mid: [130, 250] },
  ],
  55: [
    { item: 'Tank + stand (55g, 48×13×21″)', budget: [250, 400], mid: [400, 700] },
    { item: 'Sump (20-long) or HOB alternative', budget: [80, 150], mid: [150, 350] },
    { item: 'Return pump (~385 GPH at the tank)', budget: [70, 120], mid: [120, 220] },
    { item: 'Protein skimmer', budget: [140, 220], mid: [220, 450] },
    { item: 'Reef lighting (2 fixtures across 48″)', budget: [400, 700], mid: [700, 1200] },
    { item: 'Powerheads / flow', budget: [100, 180], mid: [180, 350] },
    { item: 'Heater(s) ~200–250W + controller', budget: [40, 80], mid: [80, 160] },
    { item: 'Rock (~40–55 lb) + sand (~45 lb)', budget: [90, 170], mid: [170, 300] },
    { item: 'RODI unit', budget: [80, 150], mid: [150, 250] },
    { item: 'Salt, test kits, extras', budget: [80, 140], mid: [140, 260] },
  ],
  75: [
    { item: 'Tank + stand (75g, 48×18×21″)', budget: [350, 550], mid: [550, 1000] },
    { item: 'Sump (20-long / 29g or purpose-built)', budget: [100, 180], mid: [180, 450] },
    { item: 'Return pump (~525 GPH at the tank)', budget: [80, 140], mid: [140, 250] },
    { item: 'Protein skimmer', budget: [150, 250], mid: [250, 500] },
    { item: 'Reef lighting (2 fixtures across 48″)', budget: [400, 700], mid: [700, 1400] },
    { item: 'Powerheads / flow', budget: [120, 220], mid: [220, 450] },
    { item: 'Heater(s) ~250–300W + controller', budget: [50, 90], mid: [90, 180] },
    { item: 'Rock (~50–75 lb) + sand (~70 lb)', budget: [120, 220], mid: [220, 380] },
    { item: 'RODI unit', budget: [80, 150], mid: [150, 250] },
    { item: 'Salt, test kits, extras', budget: [90, 160], mid: [160, 300] },
  ],
  120: [
    { item: 'Tank + stand (120g, 48×24×24″)', budget: [800, 1400], mid: [1400, 2800] },
    { item: 'Sump (30–40g purpose-built)', budget: [180, 350], mid: [350, 700] },
    { item: 'Return pump (~840 GPH at the tank)', budget: [120, 200], mid: [200, 380] },
    { item: 'Protein skimmer', budget: [250, 400], mid: [400, 800] },
    { item: 'Reef lighting (2–3 fixtures, 24″ punch)', budget: [600, 1000], mid: [1000, 2200] },
    { item: 'Powerheads / flow', budget: [200, 350], mid: [350, 700] },
    { item: '2× heaters ~200–250W each + controller', budget: [70, 120], mid: [120, 220] },
    { item: 'Rock (~80–120 lb) + sand (~110 lb)', budget: [200, 380], mid: [380, 650] },
    { item: 'RODI unit (higher-output)', budget: [120, 200], mid: [200, 350] },
    { item: 'Salt, test kits, ATO, extras', budget: [150, 260], mid: [260, 500] },
  ],
};
export const moneyRange = (range: [number, number]) => range.map((n) => '$' + n.toLocaleString('en-US')).join('–');
export function setupTotal(gallons: 30 | 40 | 55 | 75 | 120, tier: 'budget' | 'mid'): [number, number] {
  return SETUP_BUDGETS[gallons].reduce<[number, number]>((sum, line) => [sum[0] + line[tier][0], sum[1] + line[tier][1]], [0, 0]);
}
