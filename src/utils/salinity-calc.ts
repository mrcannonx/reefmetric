// Salinity conversions for reef aquariums.
// The three numbers a reefer sees on different instruments — specific gravity (glass
// hydrometer / swing-arm), salinity in ppt (refractometer), and conductivity in mS/cm
// (probe/controller) — all describe the same thing. These convert between them at the
// standard 25°C / 77°F reference every aquarium instrument is calibrated to, and correct
// a glass-hydrometer reading for sample temperature.
//
// The conversions are linear approximations anchored to natural seawater (35 ppt =
// SG 1.0264 = 53.0 mS/cm at 25°C) and are accurate across the reef-relevant band
// (~28–40 ppt). Outside that band they're flagged as extrapolated.

export type Unit = 'sg' | 'ppt' | 'cond';

// Natural seawater / reef target, at the 25°C reference.
export const REEF_TARGET = { ppt: 35, sg: 1.0264, cond: 53.0 };

// Anchored slopes: SG and conductivity both pinned to 35 ppt = 1.0264 / 53.0.
const SG_PER_PPT = 0.0264 / 35; // ≈ 0.0007543
const COND_PER_PPT = 53.0 / 35; // ≈ 1.5143
const VALID_MIN_PPT = 28;
const VALID_MAX_PPT = 40;

export const pptToSG = (ppt: number) => 1 + SG_PER_PPT * ppt;
export const sgToPpt = (sg: number) => (sg - 1) / SG_PER_PPT;
export const pptToCond = (ppt: number) => COND_PER_PPT * ppt;
export const condToPpt = (cond: number) => cond / COND_PER_PPT;

export interface SalinityResult {
  ppt: number;
  sg: number;
  cond: number;
  extrapolated: boolean; // outside the 28–40 ppt band the linear fit is trusted on
  status: 'very-low' | 'low' | 'ideal' | 'high' | 'very-high';
  verdict: string;
}

function classify(ppt: number): { status: SalinityResult['status']; verdict: string } {
  if (ppt < 32) return { status: 'very-low', verdict: 'Too low for a reef — corals and inverts are stressed below ~32 ppt. Top up with saltwater, not fresh.' };
  if (ppt < 34) return { status: 'low', verdict: 'A touch low. Fine for a fish-only system; nudge toward 35 for corals and inverts.' };
  if (ppt <= 36) return { status: 'ideal', verdict: 'Reef range. Natural seawater is 35 ppt (SG 1.0264) — you\'re where you want to be.' };
  if (ppt <= 38) return { status: 'high', verdict: 'A touch high. Let some water evaporate and top up with RO/DI, or do a slightly fresher water change.' };
  return { status: 'very-high', verdict: 'Too high — usually a topped-off-with-saltwater or evaporation problem. Bring it down slowly (≤1 ppt/day) to avoid shocking livestock.' };
}

/** Convert any one instrument reading to all three, at the 25°C reference. */
export function convertSalinity(from: Unit, value: number): SalinityResult {
  let ppt: number;
  if (from === 'ppt') ppt = value;
  else if (from === 'sg') ppt = sgToPpt(value);
  else ppt = condToPpt(value);

  const { status, verdict } = classify(ppt);
  return {
    ppt,
    sg: pptToSG(ppt),
    cond: pptToCond(ppt),
    extrapolated: ppt < VALID_MIN_PPT || ppt > VALID_MAX_PPT,
    status,
    verdict,
  };
}

// A glass hydrometer / swing-arm is calibrated to read true at one temperature (aquarium
// units: 25°C / 77°F). Warmer water is less dense, so the float sits lower and the reading
// comes in LOW; cooler water reads high. True SG ≈ reading + k·(sampleTemp − calTemp).
// k is water's density change near 25°C (~0.00025 per °C). Refractometers with ATC don't
// need this; refractometers without ATC should instead be calibrated at the sample temp.
const SG_PER_DEGC = 0.00025;

/** Correct a glass-hydrometer SG reading for the sample's temperature. */
export function correctHydrometerSG(readingSG: number, sampleTempC: number, calTempC = 25): number {
  return readingSG + SG_PER_DEGC * (sampleTempC - calTempC);
}

export const cToF = (c: number) => (c * 9) / 5 + 32;
export const fToC = (f: number) => ((f - 32) * 5) / 9;
