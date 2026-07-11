// Tank volume + substrate calculator for ReefMetric.
// Sources for the physical constants (stated in the page methodology too):
// - 231 cubic inches per US gallon (statutory definition).
// - Dry aragonite sand bulk density ≈ 96 lb/ft³ (~1.54 g/cm³ bulk, per CaribSea spec
//   sheets) → lbs = area(ft²) × depth(in)/12 × 96 ≈ 8 lb per ft² per inch of depth.
// - Dry reef rock displacement: porous aragonite ≈ 1.6 g/cm³ effective → 1 lb displaces
//   ≈ 0.075 gal. Flagged as an estimate in the UI; real rock varies with porosity.

export const CUBIC_IN_PER_GAL = 231;
export const SAND_LB_PER_FT2_PER_IN = 8;
export const ROCK_GAL_PER_LB = 0.075;

// Standard tank footprints (US nominal sizes, external dims in inches — the industry
// tables every manufacturer shares). Glass thickness is ignored: on standard tanks it
// under-counts volume by ~2-4%, which we call out in the methodology note.
export const STANDARD_TANKS: { key: string; label: string; l: number; w: number; h: number }[] = [
  { key: 'custom', label: 'Custom dimensions', l: 0, w: 0, h: 0 },
  { key: '10', label: '10 gal (20×10×12″)', l: 20, w: 10, h: 12 },
  { key: '20l', label: '20 long (30×12×12″)', l: 30, w: 12, h: 12 },
  { key: '29', label: '29 gal (30×12×18″)', l: 30, w: 12, h: 18 },
  { key: '40b', label: '40 breeder (36×18×16″)', l: 36, w: 18, h: 16 },
  { key: '55', label: '55 gal (48×13×21″)', l: 48, w: 13, h: 21 },
  { key: '75', label: '75 gal (48×18×21″)', l: 48, w: 18, h: 21 },
  { key: '90', label: '90 gal (48×18×24″)', l: 48, w: 18, h: 24 },
  { key: '120', label: '120 gal (48×24×24″)', l: 48, w: 24, h: 24 },
  { key: '180', label: '180 gal (72×24×24″)', l: 72, w: 24, h: 24 },
];

export interface VolumeResult {
  grossGal: number;        // full dims to the rim
  filledGal: number;       // to the actual water line
  sandGal: number;         // volume the sand bed occupies
  sandLb: number;          // sand needed for that bed
  rockGal: number;         // estimated rock displacement
  sumpGal: number;
  trueGal: number;         // what your dosing/stocking actually sees
}

export function computeVolume(
  lIn: number, wIn: number, hIn: number,
  waterlineDropIn: number,   // air gap from rim to water line
  sandDepthIn: number,
  rockLb: number,
  sumpGal: number
): VolumeResult {
  const area = lIn * wIn; // in²
  const grossGal = (area * hIn) / CUBIC_IN_PER_GAL;
  const filledGal = (area * Math.max(hIn - waterlineDropIn, 0)) / CUBIC_IN_PER_GAL;
  const sandGal = (area * sandDepthIn) / CUBIC_IN_PER_GAL;
  const sandLb = (area / 144) * sandDepthIn * SAND_LB_PER_FT2_PER_IN;
  const rockGal = rockLb * ROCK_GAL_PER_LB;
  const trueGal = Math.max(filledGal - sandGal - rockGal, 0) + Math.max(sumpGal, 0);
  return { grossGal, filledGal, sandGal, sandLb, rockGal, sumpGal: Math.max(sumpGal, 0), trueGal };
}
