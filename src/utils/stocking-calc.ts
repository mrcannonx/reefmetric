// Reef stocking / bioload sanity-check for ReefMetric.
// Bioload is genuinely fuzzy — no formula captures feeding habits, growth, and filtration
// exactly. So this is deliberately a SANITY CHECK, not a license: a relative load score
// against a conservative capacity, plus the parts that ARE reliable — minimum-tank-size
// violations and well-known aggression/shoaling rules. Every number is flagged as an estimate.

export interface Fish {
  name: string;
  family: string;
  adultSizeIn: number;
  minTankGal: number;
  bioloadFactor: number;
  temperament: 'peaceful' | 'semi' | 'aggressive';
  shoaling?: boolean;
  careNote?: string;
}

export interface Selection { fish: Fish; count: number; }

// Capacity: a "comfortable" line calibrated against real well-stocked reefs, not the old
// inch-per-gallon myth. ~1 adult bioload-unit (length × waste factor) per 1.8 gallons of
// true water volume at standard filtration. Sanity anchors this was tuned to:
//   • 40g, a pair of clowns + goby + firefish → ~60% (comfortably well-stocked)
//   • 40g, that plus a dwarf angel + wrasse → ~95% (full but fine)
//   • 125g, a tang + 2 clowns + angel + 5 chromis + wrasse → ~72% (well-stocked)
// A big skimmer / heavy filtration buys headroom; a light setup gives less.
const GAL_PER_BIOLOAD_UNIT = 1.8;
export const FILTRATION = [
  { value: 'light', label: 'Light — HOB / small skimmer', mult: 0.75 },
  { value: 'standard', label: 'Standard — properly-sized skimmer', mult: 1.0 },
  { value: 'heavy', label: 'Heavy — oversized skimmer + refugium', mult: 1.3 },
] as const;

const bioloadOf = (f: Fish) => f.adultSizeIn * f.bioloadFactor;

export interface StockingResult {
  loadUnits: number;
  capacityUnits: number;
  pct: number; // 0–∞, % of comfortable capacity
  totalFish: number;
  status: 'empty' | 'understocked' | 'well-stocked' | 'full' | 'overstocked';
  headline: string;
  warnings: string[];
}

export function computeStocking(
  trueGal: number,
  filtrationMult: number,
  selections: Selection[]
): StockingResult {
  const active = selections.filter((s) => s.count > 0);
  const loadUnits = active.reduce((sum, s) => sum + bioloadOf(s.fish) * s.count, 0);
  const capacityUnits = (trueGal / GAL_PER_BIOLOAD_UNIT) * filtrationMult;
  const totalFish = active.reduce((sum, s) => sum + s.count, 0);
  const pct = capacityUnits > 0 ? (loadUnits / capacityUnits) * 100 : 0;

  const warnings: string[] = [];

  // Reliable rule 1 — minimum tank size (nominal). Compare to the entered volume.
  for (const s of active) {
    if (s.fish.minTankGal > trueGal) {
      warnings.push(`${s.fish.name} wants at least a ${s.fish.minTankGal}-gallon tank — more than you've entered.`);
    }
  }
  // Reliable rule 2 — tang aggression: more than one tang in anything but a large system.
  const tangs = active.filter((s) => s.fish.family === 'Tang').reduce((n, s) => n + s.count, 0);
  if (tangs > 1 && trueGal < 125) {
    warnings.push('Multiple tangs in under ~125 gallons usually ends in fighting — add them together, similar size, different shapes, or keep one.');
  }
  // Reliable rule 3 — one dwarf angel per tank.
  const angels = active.filter((s) => s.fish.family === 'Angelfish').reduce((n, s) => n + s.count, 0);
  if (angels > 1) {
    warnings.push('Dwarf angels are territorial with their own kind — one per tank unless it\'s very large and heavily aquascaped.');
  }
  // Reliable rule 4 — shoaling fish kept in unstable small groups.
  for (const s of active) {
    if (s.fish.shoaling && s.count >= 2 && s.count <= 4) {
      warnings.push(`${s.fish.name} does best as a single or an odd group of 5+ — groups of 2–4 tend to bully down to one.`);
    }
  }
  // Care notes for anything selected.
  for (const s of active) {
    if (s.fish.careNote) warnings.push(`${s.fish.name}: ${s.fish.careNote}`);
  }

  let status: StockingResult['status'];
  let headline: string;
  if (totalFish === 0) {
    status = 'empty';
    headline = 'Add a few fish to see the load.';
  } else if (pct < 45) {
    status = 'understocked';
    headline = 'Plenty of room — you could add more, slowly.';
  } else if (pct <= 90) {
    status = 'well-stocked';
    headline = 'A comfortable, well-stocked reef.';
  } else if (pct <= 120) {
    status = 'full';
    headline = 'Full house — stop here and keep up with water changes.';
  } else {
    status = 'overstocked';
    headline = 'Over the comfortable line — expect nitrate and aggression pressure.';
  }

  return { loadUnits, capacityUnits, pct, totalFish, status, headline, warnings };
}
