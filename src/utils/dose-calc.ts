// Reef dosing calculator for ReefMetric.
// Chemistry: dose to raise a parameter = (target - current) × strength × gallons,
// where strength = dose (mL or g) to raise the parameter by 1 unit in 1 US gallon.
// Safety: never raise faster than the community-accepted daily maximum — the tool
// splits a large correction across days automatically.

export type Param = 'alk' | 'ca' | 'mg';

export interface Additive {
  name: string;
  parameter: Param;
  doseUnit: 'mL' | 'g';
  perUnitPerGallon: number; // dose to raise the parameter by 1 unit (1 dKH / 1 ppm) in 1 gallon
  note?: string;
  source?: string;
}

export interface DoseData {
  additives: Additive[];
  safeDailyMax: { alk_dKH: number; ca_ppm: number; mg_ppm: number };
}

export const PARAM_META: Record<Param, { label: string; unit: string; typical: string }> = {
  alk: { label: 'Alkalinity', unit: 'dKH', typical: 'target ~8–9 dKH' },
  ca: { label: 'Calcium', unit: 'ppm', typical: 'target ~420–440 ppm' },
  mg: { label: 'Magnesium', unit: 'ppm', typical: 'target ~1300–1350 ppm' },
};

export interface DoseResult {
  rise: number;
  totalDose: number;
  unit: 'mL' | 'g';
  days: number;
  perDay: number;
  dailyMax: number;
  exceedsDaily: boolean;
  valid: boolean;
}

export function safeDailyFor(param: Param, m: DoseData['safeDailyMax']): number {
  return param === 'alk' ? m.alk_dKH : param === 'ca' ? m.ca_ppm : m.mg_ppm;
}

export function computeDose(opts: {
  gallons: number;
  param: Param;
  current: number;
  target: number;
  additive: Additive;
  safeDailyMax: DoseData['safeDailyMax'];
}): DoseResult {
  const rise = opts.target - opts.current;
  const dailyMax = safeDailyFor(opts.param, opts.safeDailyMax);
  if (!(opts.gallons > 0) || rise <= 0 || !opts.additive) {
    return { rise: Math.max(0, rise), totalDose: 0, unit: opts.additive?.doseUnit ?? 'mL', days: 0, perDay: 0, dailyMax, exceedsDaily: false, valid: rise <= 0 };
  }
  const totalDose = rise * opts.additive.perUnitPerGallon * opts.gallons;
  const days = dailyMax > 0 ? Math.max(1, Math.ceil(rise / dailyMax)) : 1;
  return {
    rise,
    totalDose,
    unit: opts.additive.doseUnit,
    days,
    perDay: totalDose / days,
    dailyMax,
    exceedsDaily: days > 1,
    valid: true,
  };
}
