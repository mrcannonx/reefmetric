// Existing size-guide budget ranges, stored as numbers so intros, tables, totals,
// and the guides hub agree. Editorial US estimates, not newly checked prices.
export interface SetupBudgetLine { item: string; budget: [number, number]; mid: [number, number]; }
export const SETUP_BUDGETS: Record<30 | 120, SetupBudgetLine[]> = {
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
export function setupTotal(gallons: 30 | 120, tier: 'budget' | 'mid'): [number, number] {
  return SETUP_BUDGETS[gallons].reduce<[number, number]>((sum, line) => [sum[0] + line[tier][0], sum[1] + line[tier][1]], [0, 0]);
}
