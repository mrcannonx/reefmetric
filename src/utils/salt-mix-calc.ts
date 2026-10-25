// Dry salt batch arithmetic. The reader supplies their maker's label rate for
// their chosen salinity; no salt strength or salinity conversion is inferred.
export const US_GALLON_LITERS = 3.785411784;
export const SALT_MIX_SOURCE = 'https://www.tropic-marin-smartinfo.com/pro-reef?lang=en';
export const UNIT_SOURCE = 'https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=958917';

export interface SaltMixInput {
  mode: 'batch' | 'change';
  volume: number;
  volumeUnit: 'gal' | 'L';
  changePercent: number;
  gramsPerUnit: number;
  rateUnit: 'g/L' | 'g/gal';
}

export function computeSaltMix(input: SaltMixInput) {
  if (!['batch', 'change'].includes(input.mode)
    || !['gal', 'L'].includes(input.volumeUnit)
    || !['g/L', 'g/gal'].includes(input.rateUnit)) {
    throw new RangeError('Choose a valid batch type and units.');
  }
  if (!Number.isFinite(input.volume) || input.volume < 0
    || !Number.isFinite(input.gramsPerUnit) || input.gramsPerUnit <= 0) {
    throw new RangeError('Enter a water amount of zero or more and a label rate above zero.');
  }
  if (input.mode === 'change' && (!Number.isFinite(input.changePercent)
    || input.changePercent < 0 || input.changePercent > 100)) {
    throw new RangeError('Enter a water change from 0 to 100 percent.');
  }
  const batchAmount = input.mode === 'change' ? input.volume * (input.changePercent / 100) : input.volume;
  const liters = input.volumeUnit === 'L' ? batchAmount : batchAmount * US_GALLON_LITERS;
  const gallons = input.volumeUnit === 'gal' ? batchAmount : batchAmount / US_GALLON_LITERS;
  const basisAmount = input.rateUnit === 'g/L' ? liters : gallons;
  const grams = basisAmount * input.gramsPerUnit;
  const kilograms = grams / 1000;
  if (![liters, gallons, grams, kilograms].every(Number.isFinite)) {
    throw new RangeError('Those numbers are too large. Check the water amount and label rate.');
  }
  return { liters, gallons, grams, kilograms, basisAmount };
}

// Purely mathematical examples, not product recipes. Rendered at build time
// and calculated with the same function as the interactive tool.
export const SALT_MIX_EXAMPLES: { label: string; input: SaltMixInput }[] = [
  { label: 'Small batch', input: { mode: 'batch', volume: 5, volumeUnit: 'gal', changePercent: 20, gramsPerUnit: 150, rateUnit: 'g/gal' } },
  { label: 'Metric batch', input: { mode: 'batch', volume: 20, volumeUnit: 'L', changePercent: 20, gramsPerUnit: 38, rateUnit: 'g/L' } },
  { label: '20% of a 75 US gal system', input: { mode: 'change', volume: 75, volumeUnit: 'gal', changePercent: 20, gramsPerUnit: 150, rateUnit: 'g/gal' } },
];
