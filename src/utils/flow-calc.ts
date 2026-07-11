// Reef flow / wavemaker calculator for ReefMetric.
// Target total turnover (tank volumes per hour) comes from BRS's published 20-40x guidance,
// banded by coral type (see wavemakers.json turnoverGuidance, each band sourced).
// We subtract the return pump's contribution, then rank wavemakers by how efficiently
// they cover the remaining powerhead flow — manufacturer max-flow ratings, stated as such.

export interface Wavemaker {
  brand: string;
  model: string;
  priceUSD: number;
  maxFlowGPH: number;
  watts: number;
  tankRangeGal: string | null;
  controller: string;
  knownIssues?: string[];
  retailers?: string[];
  source: string;
  imageUrl?: string | null;
}

export interface TurnoverBand {
  key: string;
  band: string;
  minTurnover: number;
  maxTurnover: number;
}

export interface FlowTarget {
  minGPH: number;
  maxGPH: number;
  midGPH: number;
  powerheadMinGPH: number; // after subtracting return flow
  powerheadMidGPH: number;
  powerheadMaxGPH: number;
}

export function flowTarget(displayGal: number, band: TurnoverBand, returnGPH: number): FlowTarget {
  const minGPH = displayGal * band.minTurnover;
  const maxGPH = displayGal * band.maxTurnover;
  const midGPH = (minGPH + maxGPH) / 2;
  const sub = (v: number) => Math.max(v - returnGPH, 0);
  return { minGPH, maxGPH, midGPH, powerheadMinGPH: sub(minGPH), powerheadMidGPH: sub(midGPH), powerheadMaxGPH: sub(maxGPH) };
}

export interface WavemakerFit {
  wm: Wavemaker;
  unitsForMid: number;        // units needed to reach the midpoint target
  comboCost: number;          // price × units
  comboFlowGPH: number;       // maxFlow × units
  costPer1kGPH: number;       // value metric on a single unit
  overkill: boolean;          // one unit alone exceeds the max target by >2x
}

export function rankWavemakers(target: FlowTarget, wms: Wavemaker[], maxUnits = 4): WavemakerFit[] {
  if (target.powerheadMidGPH <= 0) return [];
  return wms
    .map((wm) => {
      const unitsForMid = Math.min(Math.ceil(target.powerheadMidGPH / wm.maxFlowGPH), maxUnits);
      const comboFlowGPH = wm.maxFlowGPH * unitsForMid;
      return {
        wm,
        unitsForMid,
        comboCost: wm.priceUSD * unitsForMid,
        comboFlowGPH,
        costPer1kGPH: (wm.priceUSD / wm.maxFlowGPH) * 1000,
        overkill: wm.maxFlowGPH > target.powerheadMaxGPH * 2,
      };
    })
    // must actually reach the midpoint within maxUnits, and not be absurdly oversized
    .filter((f) => f.comboFlowGPH >= target.powerheadMidGPH && !f.overkill)
    .sort((a, b) => a.comboCost - b.comboCost);
}
