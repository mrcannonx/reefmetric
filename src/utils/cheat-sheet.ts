// The Reef Gear Cheat Sheet — the lead magnet's single source of truth.
// Both the web page (/cheat-sheet) and the email version (/cheat-sheet-email.html,
// fetched + sent verbatim by the factory API on signup) are computed here AT BUILD
// TIME from the same datasets and physics as the calculators and roundups — so the
// sheet can never drift from what the site itself recommends.

import { recommend, type Pump, type SizingInputs } from './pump-calc';
import { recommendSkimmers, type Skimmer } from './skimmer-calc';
import { parAtHeight, type Light } from './light-calc';
import { estimateCost } from './cost-calc';
import pumpData from '../data/pumps.json';
import skimmerData from '../data/skimmers.json';
import lightData from '../data/lights.json';

const pumps = (pumpData as any).pumps as Pump[];
const skimmers = (skimmerData as any).skimmers as Skimmer[];
const lights = (lightData as any).lights as Light[];

export interface SheetPick {
  name: string;
  price: number | null;
  note: string;
}
export interface SheetRow {
  key: string;
  label: string;
  gallons: number;
  pump: SheetPick | null;
  skimmer: SheetPick | null;
  light: SheetPick | null;
  upfrontLow: number;
  upfrontHigh: number;
  monthlyLow: number;
  monthlyHigh: number;
}

interface SizeDef {
  key: string;
  label: string;
  gallons: number;
  hasSump: boolean;
  plumbing: SizingInputs; // same reference-plumbing idiom as /reviews/best-return-pumps
  lightModel: string;     // editorial pick from the 4 verified-PAR fixtures (same calls as the lighting roundup)
  lightNote: string;
}

// Reference plumbing per size: nano/40B/75/120 mirror the return-pump roundup's classes;
// 30 and 55 interpolate the same typical-build assumptions (stand height, 1" PVC, 4 elbows).
const SIZES: SizeDef[] = [
  {
    key: '30', label: '30 Gallon', gallons: 30, hasSump: false,
    plumbing: { displayGallons: 30, turnover: 7, staticHeadFt: 3.5, pipeIdInches: 1.029, pipeLengthFt: 6, elbows: 3 },
    lightModel: 'Prime 16HD',
    lightNote: 'cheapest fixture with a real manufacturer PAR figure — right for softies/LPS at this size',
  },
  {
    key: '40b', label: '40 Breeder', gallons: 40, hasSump: true,
    plumbing: { displayGallons: 40, turnover: 7, staticHeadFt: 4, pipeIdInches: 1.029, pipeLengthFt: 8, elbows: 4 },
    lightModel: 'Hydra 32 HD',
    lightNote: 'independent lab PAR curve; one fixture covers the 36in footprint for a mixed reef',
  },
  {
    key: '55', label: '55 Gallon', gallons: 55, hasSump: true,
    plumbing: { displayGallons: 55, turnover: 7, staticHeadFt: 4.5, pipeIdInches: 1.029, pipeLengthFt: 10, elbows: 4 },
    lightModel: 'Prime 16HD',
    lightNote: 'a 55 is 48in long — plan on two of these (or step up to two larger fixtures for SPS)',
  },
  {
    key: '75', label: '75 Gallon', gallons: 75, hasSump: true,
    plumbing: { displayGallons: 75, turnover: 7, staticHeadFt: 4.5, pipeIdInches: 1.029, pipeLengthFt: 10, elbows: 4 },
    lightModel: 'Hydra 32 HD',
    lightNote: 'the all-around pick; add a second for full SPS coverage across 48in',
  },
  {
    key: '120', label: '120 Gallon', gallons: 120, hasSump: true,
    plumbing: { displayGallons: 120, turnover: 7, staticHeadFt: 5, pipeIdInches: 1.36, pipeLengthFt: 12, elbows: 4 },
    lightModel: 'Atlantik iCon',
    lightNote: 'widest published coverage map (43×25in) and the highest verified PAR ceiling here',
  },
];

export function buildCheatSheet(): { rows: SheetRow[]; dataDate: string } {
  const rows = SIZES.map((s): SheetRow => {
    // Pump: smallest pump that still hits 7× turnover through this size's real plumbing.
    const { targetGPH, results } = recommend(s.plumbing, pumps);
    const fit = results.filter((r) => r.meetsTarget)[0] ?? null;
    const pump: SheetPick | null = fit
      ? {
          name: `${fit.pump.brand} ${fit.pump.model}`,
          price: fit.pump.approxPriceUSD ?? null,
          note: `delivers ~${Math.round(fit.deliveredGPH)} GPH here (target ${targetGPH})`,
        }
      : null;

    // Skimmer: smallest honest medium-bioload capacity that covers the tank.
    const sFit = recommendSkimmers(s.gallons, 'medium', skimmers).filter((r) => r.fits)[0] ?? null;
    const skimmer: SheetPick | null = sFit
      ? {
          name: `${sFit.skimmer.brand} ${sFit.skimmer.model}`,
          price: sFit.skimmer.priceUSD ?? null,
          note: `honest ${sFit.effectiveGallons}-gal capacity at medium bioload`,
        }
      : null;

    // Light: editorial pick from the 4 verified-PAR fixtures, priced from the dataset.
    const l = lights.find((x) => x.model === s.lightModel) ?? null;
    const light: SheetPick | null = l
      ? {
          name: `${l.brand} ${l.model}`,
          price: (l as any).priceUSD ?? null,
          note: `${Math.round(parAtHeight(l, 18).par)} PAR at 18in — ${s.lightNote}`,
        }
      : null;

    // Build-cost worksheet numbers: mid tier, mixed reef, US-average electricity.
    const cost = estimateCost({ gallons: s.gallons, tier: 'mid', hasSump: s.hasSump, coral: 'mixed', kwhRate: 0.17 });

    return {
      key: s.key,
      label: s.label,
      gallons: s.gallons,
      pump,
      skimmer,
      light,
      upfrontLow: cost.upfrontLow,
      upfrontHigh: cost.upfrontHigh,
      monthlyLow: cost.monthlyLow,
      monthlyHigh: cost.monthlyHigh,
    };
  });

  return { rows, dataDate: (pumpData as any).generated as string };
}

export const money = (n: number | null): string => (n != null ? `$${Math.round(n)}` : 'check price');
