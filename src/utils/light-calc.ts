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

// Explore each source in its own measurement frame. The coordinate may mean a
// dry bench distance or depth below water; these are not interchangeable. Only
// interpolate within a source curve. Outside it (or off a single point), PAR is unknown.
export function parAtHeight(light: Light, heightIn: number): { par: number | null; exact: boolean } {
  const pts = [...light.parCurve].sort((a, b) => a.heightIn - b.heightIn);
  if (!Number.isFinite(heightIn) || pts.length === 0) return { par: null, exact: false };
  if (pts.length === 1) return { par: pts[0].heightIn === heightIn ? pts[0].par : null, exact: pts[0].heightIn === heightIn };
  if (heightIn <= pts[0].heightIn) return { par: heightIn === pts[0].heightIn ? pts[0].par : null, exact: heightIn === pts[0].heightIn };
  const last = pts[pts.length - 1];
  if (heightIn >= last.heightIn) return { par: heightIn === last.heightIn ? last.par : null, exact: heightIn === last.heightIn };
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    if (heightIn >= a.heightIn && heightIn <= b.heightIn) {
      const t = (heightIn - a.heightIn) / (b.heightIn - a.heightIn);
      return { par: a.par + t * (b.par - a.par), exact: false };
    }
  }
  return { par: null, exact: false };
}

export interface LightFit {
  light: Light;
  parAtHeight: number | null;
  inBand: boolean;
  singlePoint: boolean; // only one manufacturer data point exists — flag as approximation
}

export function fitLightsToBand(lights: Light[], band: ParBand, heightIn: number): LightFit[] {
  const results: LightFit[] = lights.map((light) => {
    const { par } = parAtHeight(light, heightIn);
    return {
      light,
      parAtHeight: par === null ? null : Math.round(par),
      inBand: par !== null && par >= band.minPPFD && par <= band.maxPPFD * 1.15, // small headroom before "overkill"
      singlePoint: light.parCurve.length <= 1,
    };
  });
  results.sort((a, b) => {
    if (a.inBand && b.inBand) return (a.light.priceUSD ?? Infinity) - (b.light.priceUSD ?? Infinity);
    if (a.inBand) return -1;
    if (b.inBand) return 1;
    return (b.parAtHeight ?? -Infinity) - (a.parAtHeight ?? -Infinity);
  });
  return results;
}
