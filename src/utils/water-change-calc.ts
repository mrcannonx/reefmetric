// Water change calculator for ReefMetric.
// Pure dilution math: one water change of fraction p leaves C × (1 − p) of a dissolved
// nutrient behind. Chaining n changes leaves C × (1 − p)^n. This model assumes nothing new
// is added between changes — real tanks keep producing nitrate/phosphate, so we surface
// that assumption in the UI instead of hiding it.

export interface WCPlan {
  pct: number;            // change size as a percent of true water volume
  changes: number;        // number of changes to reach (or pass) the target
  totalNewWaterGal: number;
  levels: number[];       // level after each change, for the step-down readout
}

export const STANDARD_PCTS = [10, 15, 20, 25, 30, 50];

// Fraction that must be removed in ONE change to go from current to target.
export function singleChangeFraction(current: number, target: number): number {
  if (current <= 0 || target >= current) return 0;
  return 1 - target / current;
}

// Number of p-sized changes to reach target: smallest n with current × (1−p)^n ≤ target.
export function changesNeeded(current: number, target: number, pct: number): number {
  const p = pct / 100;
  if (current <= 0 || target >= current) return 0;
  if (target <= 0 || p <= 0 || p >= 1) return Infinity; // dilution never reaches exactly 0
  return Math.ceil(Math.log(target / current) / Math.log(1 - p));
}

export function planFor(current: number, target: number, pct: number, volumeGal: number, maxSteps = 40): WCPlan | null {
  const n = changesNeeded(current, target, pct);
  if (!isFinite(n) || n <= 0 || n > maxSteps) return null;
  const p = pct / 100;
  const levels: number[] = [];
  let c = current;
  for (let i = 0; i < n; i++) {
    c = c * (1 - p);
    levels.push(c);
  }
  return { pct, changes: n, totalNewWaterGal: n * volumeGal * p, levels };
}
