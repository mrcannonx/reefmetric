// Salt mix cost calculator for ReefMetric.
// The number that matters is cost per MIXED GALLON, not the sticker price on the box —
// a "cheap" box that makes fewer gallons can cost more per water change.

export interface Salt {
  brand: string;
  product: string;
  gallonsPerBox: number;
  priceUSD: number;
  params?: string;
  retailers?: string[];
}

export const FREQUENCIES: { value: string; label: string; perMonth: number }[] = [
  { value: 'weekly', label: 'Weekly', perMonth: 4.3 },
  { value: 'biweekly', label: 'Every 2 weeks', perMonth: 2.15 },
  { value: 'monthly', label: 'Monthly', perMonth: 1 },
];

export function costPerGallon(s: Salt): number {
  return s.gallonsPerBox > 0 ? s.priceUSD / s.gallonsPerBox : 0;
}

export function gallonsPerMonth(tankGallons: number, changePct: number, changesPerMonth: number): number {
  return tankGallons * (changePct / 100) * changesPerMonth;
}

export interface SaltResult {
  salt: Salt;
  costPerGal: number;
  monthly: number;
}

export function rankSalts(
  tankGallons: number,
  changePct: number,
  changesPerMonth: number,
  salts: Salt[]
): { results: SaltResult[]; gallonsMonthly: number } {
  const gpm = gallonsPerMonth(tankGallons, changePct, changesPerMonth);
  const results = salts
    .map((s) => ({ salt: s, costPerGal: costPerGallon(s), monthly: costPerGallon(s) * gpm }))
    .sort((a, b) => a.costPerGal - b.costPerGal);
  return { results, gallonsMonthly: gpm };
}
