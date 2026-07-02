// Reef LED PAR sizing for ReefMetric.
// Most manufacturers publish PAR at only ONE mounting height (commonly 20in) —
// unlike pump curves, a real multi-point PPFD-vs-height curve is rare, so we
// interpolate/extrapolate where we have 2+ points and flag single-point fixtures
// as an approximation rather than pretend to a curve we don't have.

export interface ParPoint { heightIn: number; par: number; }

export interface Light {
  brand: string;
  model: string;
  priceUSD?: number | null;
  footprintIn?: string | null;
  footprintNotes?: string | null;
  parCurve: ParPoint[];
  curveSource?: string;
  watts?: number | null;
  dimmable?: boolean;
  app?: string | null;
  spectrum?: string | null;
  retailers?: string[];
  priceSource?: string;
  parSource?: string;
  imageUrl?: string | null;
}

export interface ParBand { key: string; label: string; minPPFD: number; maxPPFD: number; source?: string; }

// PAR (PPFD, μmol/m²/s) at `heightIn` above the water. Single-point fixtures return
// that point unchanged (their only known value); 2+ points interpolate linearly and
// extrapolate flat past the ends (safer than projecting an unverified falloff rate).
export function parAtHeight(light: Light, heightIn: number): { par: number; exact: boolean } {
  const pts = [...light.parCurve].sort((a, b) => a.heightIn - b.heightIn);
  if (pts.length === 0) return { par: 0, exact: false };
  if (pts.length === 1) return { par: pts[0].par, exact: pts[0].heightIn === heightIn };
  if (heightIn <= pts[0].heightIn) return { par: pts[0].par, exact: heightIn === pts[0].heightIn };
  const last = pts[pts.length - 1];
  if (heightIn >= last.heightIn) return { par: last.par, exact: heightIn === last.heightIn };
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    if (heightIn >= a.heightIn && heightIn <= b.heightIn) {
      const t = (heightIn - a.heightIn) / (b.heightIn - a.heightIn);
      return { par: a.par + t * (b.par - a.par), exact: false };
    }
  }
  return { par: 0, exact: false };
}

export interface LightFit {
  light: Light;
  parAtHeight: number;
  inBand: boolean;
  singlePoint: boolean; // only one manufacturer data point exists — flag as approximation
}

export function fitLightsToBand(lights: Light[], band: ParBand, heightIn: number): LightFit[] {
  const results: LightFit[] = lights.map((light) => {
    const { par } = parAtHeight(light, heightIn);
    return {
      light,
      parAtHeight: Math.round(par),
      inBand: par >= band.minPPFD && par <= band.maxPPFD * 1.15, // small headroom before "overkill"
      singlePoint: light.parCurve.length <= 1,
    };
  });
  results.sort((a, b) => {
    if (a.inBand && b.inBand) return (a.light.priceUSD ?? Infinity) - (b.light.priceUSD ?? Infinity);
    if (a.inBand) return -1;
    if (b.inBand) return 1;
    return b.parAtHeight - a.parAtHeight;
  });
  return results;
}
