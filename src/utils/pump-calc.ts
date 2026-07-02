// Return pump sizing physics for ReefMetric.
// This is the "show our math" core — it must be correct.
// Units: flow GPH (I/O), converted to GPM internally for friction; head in feet; pipe ID in inches.

export interface PumpCurvePoint { headFt: number; flowGPH: number; }

export interface Pump {
  brand: string;
  model: string;
  type: 'DC' | 'AC';
  maxFlowGPH: number;
  maxHeadFt: number;
  curve: PumpCurvePoint[];
  watts?: number | null;
  approxPriceUSD?: number | null;
  retailers?: string[];
  modeled?: boolean;
  source?: string;
  imageUrl?: string | null;
}

export interface SizingInputs {
  displayGallons: number;
  turnover: number;      // desired display turnovers per hour (e.g. 7)
  staticHeadFt: number;  // vertical rise: sump water surface -> return outlet
  pipeIdInches: number;  // inner diameter of return plumbing
  pipeLengthFt: number;  // total straight run
  elbows: number;        // number of 90° elbows
}

// Nominal PVC size -> Schedule-40 inner diameter (inches).
export const PIPE_IDS: { label: string; id: number }[] = [
  { label: '1/2"', id: 0.602 },
  { label: '3/4"', id: 0.804 },
  { label: '1"', id: 1.029 },
  { label: '1-1/4"', id: 1.360 },
  { label: '1-1/2"', id: 1.610 },
];

export const TURNOVER_GUIDE = [
  { label: 'Fish-only / low-flow (5×)', x: 5 },
  { label: 'Mixed reef — recommended (7×)', x: 7 },
  { label: 'SPS / high-flow (10×)', x: 10 },
];

// Hazen-Williams head loss (feet) for water in PVC (C = 150).
// per 100 ft = 0.2083 · (100/C)^1.852 · Q^1.852 / d^4.8655 ; Q in GPM, d in inches.
export function frictionHeadFt(flowGPH: number, pipeIdInches: number, equivLengthFt: number, C = 150): number {
  const Q = flowGPH / 60; // GPM
  if (Q <= 0 || pipeIdInches <= 0 || equivLengthFt <= 0) return 0;
  const per100 = (0.2083 * Math.pow(100 / C, 1.852) * Math.pow(Q, 1.852)) / Math.pow(pipeIdInches, 4.8655);
  return per100 * (equivLengthFt / 100);
}

// 90° elbow equivalent length (ft), rule of thumb L/D ≈ 30.
export function elbowEquivLengthFt(pipeIdInches: number): number {
  return 30 * (pipeIdInches / 12);
}

// System head (ft) required to push `flowGPH` through the plumbing.
export function systemHeadFt(flowGPH: number, i: SizingInputs): number {
  const equivLen = i.pipeLengthFt + i.elbows * elbowEquivLengthFt(i.pipeIdInches);
  return i.staticHeadFt + frictionHeadFt(flowGPH, i.pipeIdInches, equivLen);
}

// Pump flow (GPH) at a given head (ft), interpolating its curve.
export function pumpFlowAtHead(pump: Pump, headFt: number): number {
  const pts = [...pump.curve].sort((a, b) => a.headFt - b.headFt);
  if (pts.length === 0) return 0;
  if (headFt <= pts[0].headFt) return pts[0].flowGPH;
  const last = pts[pts.length - 1];
  if (headFt >= last.headFt) return 0;
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    if (headFt >= a.headFt && headFt <= b.headFt) {
      const t = (headFt - a.headFt) / (b.headFt - a.headFt);
      return a.flowGPH + t * (b.flowGPH - a.flowGPH);
    }
  }
  return 0;
}

// Operating point: flow where the pump curve meets the system curve.
// systemHead rises with flow; pumpFlowAtHead falls with head -> one intersection. Bisection.
export function operatingFlowGPH(pump: Pump, i: SizingInputs): { flowGPH: number; headFt: number } {
  if (systemHeadFt(0, i) >= pump.maxHeadFt) {
    return { flowGPH: 0, headFt: systemHeadFt(0, i) };
  }
  const f = (Q: number) => pumpFlowAtHead(pump, systemHeadFt(Q, i)) - Q;
  let lo = 0, hi = pump.maxFlowGPH;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  const flow = (lo + hi) / 2;
  return { flowGPH: flow, headFt: systemHeadFt(flow, i) };
}

export interface Recommendation {
  pump: Pump;
  deliveredGPH: number;
  operatingHeadFt: number;
  meetsTarget: boolean;
  turnoverAtDisplay: number;
}

export function recommend(i: SizingInputs, pumps: Pump[]): { targetGPH: number; totalHeadAtTarget: number; results: Recommendation[] } {
  const targetGPH = i.displayGallons * i.turnover;
  const results: Recommendation[] = pumps.map((pump) => {
    const op = operatingFlowGPH(pump, i);
    return {
      pump,
      deliveredGPH: Math.round(op.flowGPH),
      operatingHeadFt: Math.round(op.headFt * 10) / 10,
      meetsTarget: op.flowGPH >= targetGPH,
      turnoverAtDisplay: i.displayGallons > 0 ? Math.round((op.flowGPH / i.displayGallons) * 10) / 10 : 0,
    };
  });
  results.sort((a, b) => {
    if (a.meetsTarget && b.meetsTarget) return a.deliveredGPH - b.deliveredGPH; // smallest sufficient first
    if (a.meetsTarget) return -1;
    if (b.meetsTarget) return 1;
    return b.deliveredGPH - a.deliveredGPH; // closest undersized first
  });
  return {
    targetGPH: Math.round(targetGPH),
    totalHeadAtTarget: Math.round(systemHeadFt(targetGPH, i) * 10) / 10,
    results,
  };
}
