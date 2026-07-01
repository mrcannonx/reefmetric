// Reef build cost estimator for ReefMetric.
// These are ESTIMATE ranges, not quotes — every output is presented as a range and
// clearly labelled. Component costs scale with tank volume and a build tier; the pump
// and skimmer baselines are anchored to the medians of our real spec datasets.

export type Tier = 'budget' | 'mid' | 'premium';
export type Coral = 'softie' | 'mixed' | 'sps';

export interface CostInputs {
  gallons: number;
  tier: Tier;
  hasSump: boolean;
  coral: Coral;
  kwhRate: number; // $ per kWh
}

export const TIERS: { value: Tier; label: string }[] = [
  { value: 'budget', label: 'Budget — value gear' },
  { value: 'mid', label: 'Mid-range (recommended)' },
  { value: 'premium', label: 'Premium — top-shelf' },
];
export const CORALS: { value: Coral; label: string }[] = [
  { value: 'softie', label: 'Softies / LPS (lower light)' },
  { value: 'mixed', label: 'Mixed reef' },
  { value: 'sps', label: 'SPS-dominant (high light + flow)' },
];

interface Comp { key: string; base: number; perGal: number; sumpOnly?: boolean; coralScale?: boolean; }
const COMPONENTS: Comp[] = [
  { key: 'Tank + stand', base: 120, perGal: 6 },
  { key: 'Sump', base: 110, perGal: 1.5, sumpOnly: true },
  { key: 'Return pump', base: 70, perGal: 0.7 },
  { key: 'Protein skimmer', base: 110, perGal: 1.3 },
  { key: 'Reef light', base: 150, perGal: 3.5, coralScale: true },
  { key: 'Powerheads / flow', base: 70, perGal: 1.0, coralScale: true },
  { key: 'Heater + controller', base: 30, perGal: 0.3 },
  { key: 'Rock + sand', base: 20, perGal: 2.8 },
  { key: 'RODI unit', base: 120, perGal: 0.2 },
  { key: 'Salt, test kits, extras', base: 70, perGal: 0.8 },
];
const TIER_MULT: Record<Tier, number> = { budget: 0.72, mid: 1.0, premium: 1.7 };
const CORAL_MULT: Record<Coral, number> = { softie: 0.75, mixed: 1.0, sps: 1.4 };
const WATTS_PER_GAL: Record<Tier, number> = { budget: 2.3, mid: 1.9, premium: 1.6 }; // premium runs more efficient DC gear

const round5 = (n: number) => Math.round(n / 5) * 5;

export interface CostLine { item: string; low: number; high: number; }
export interface CostEstimate {
  lines: CostLine[];
  upfrontLow: number;
  upfrontHigh: number;
  monthlyLow: number;
  monthlyHigh: number;
  avgWatts: number;
}

export function estimateCost(i: CostInputs): CostEstimate {
  const g = Math.max(0, i.gallons);
  const tMult = TIER_MULT[i.tier];
  const cMult = CORAL_MULT[i.coral];
  const lines: CostLine[] = [];
  let upLow = 0, upHigh = 0;
  for (const c of COMPONENTS) {
    if (c.sumpOnly && !i.hasSump) continue;
    let cost = (c.base + c.perGal * g) * tMult;
    if (c.coralScale) cost *= cMult;
    const low = round5(cost * 0.85);
    const high = round5(cost * 1.2);
    lines.push({ item: c.key, low, high });
    upLow += low; upHigh += high;
  }

  // Monthly running cost estimate.
  const avgWatts = Math.round(g * WATTS_PER_GAL[i.tier]);
  const elec = (avgWatts / 1000) * 24 * 30 * i.kwhRate; // $/mo
  const saltWater = g * 0.22;          // salt + RODI for ~monthly water changes
  const consumables = i.tier === 'premium' ? 40 : i.tier === 'mid' ? 25 : 15; // reagents, food, additives
  const monthly = elec + saltWater + consumables;

  return {
    lines,
    upfrontLow: round5(upLow),
    upfrontHigh: round5(upHigh),
    monthlyLow: round5(monthly * 0.85),
    monthlyHigh: round5(monthly * 1.2),
    avgWatts,
  };
}
