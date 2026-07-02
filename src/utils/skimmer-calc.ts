// Protein skimmer sizing for ReefMetric.
// Manufacturer "rated up to X gallons" numbers are optimistic and assume light bioload.
// We derate by bioload so the recommendation is honest — the reef community rule of thumb
// is "buy a skimmer rated for roughly 2× your display," which our heavy-load factor mirrors.

export interface Skimmer {
  brand: string;
  model: string;
  type: 'in-sump' | 'HOB' | 'nano-AIO';
  ratedGallons: number;
  ratingLight?: number | null;
  ratingMedium?: number | null;
  ratingHeavy?: number | null;
  bodyDiameterIn?: number | null;
  footprintIn?: string | null;
  minSumpDepthIn?: number | null;
  pumpWatts?: number | null;
  priceUSD?: number | null;
  retailers?: string[];
  source?: string;
  imageUrl?: string | null;
}

export type Bioload = 'light' | 'medium' | 'heavy';

export const BIOLOAD_OPTIONS: { value: Bioload; label: string }[] = [
  { value: 'light', label: 'Light — FOWLR / few fish, LPS' },
  { value: 'medium', label: 'Medium — mixed reef (recommended)' },
  { value: 'heavy', label: 'Heavy — lots of fish / SPS, heavy feeding' },
];

// Applied only when a manufacturer publishes a single headline number (no light/med/heavy breakdown).
const DERATE: Record<Bioload, number> = { light: 1.0, medium: 0.7, heavy: 0.5 };

export function effectiveCapacity(s: Skimmer, bioload: Bioload): number {
  const published = bioload === 'light' ? s.ratingLight : bioload === 'medium' ? s.ratingMedium : s.ratingHeavy;
  if (published != null && published > 0) return Math.round(published);
  return Math.round(s.ratedGallons * DERATE[bioload]);
}

export interface SkimmerResult {
  skimmer: Skimmer;
  effectiveGallons: number;
  fits: boolean;
  usesPublishedRating: boolean;
}

export interface SkimmerFilters {
  type?: string;      // 'any' | 'in-sump' | 'HOB' | 'nano-AIO'
  maxPrice?: number;  // 0/undefined = no cap
}

export function recommendSkimmers(
  displayGallons: number,
  bioload: Bioload,
  skimmers: Skimmer[],
  filters: SkimmerFilters = {}
): SkimmerResult[] {
  let list = skimmers;
  if (filters.type && filters.type !== 'any') list = list.filter((s) => s.type === filters.type);
  if (filters.maxPrice && filters.maxPrice > 0) list = list.filter((s) => s.priceUSD == null || s.priceUSD <= filters.maxPrice!);

  const results: SkimmerResult[] = list.map((s) => {
    const published = bioload === 'light' ? s.ratingLight : bioload === 'medium' ? s.ratingMedium : s.ratingHeavy;
    const eff = effectiveCapacity(s, bioload);
    return { skimmer: s, effectiveGallons: eff, fits: eff >= displayGallons, usesPublishedRating: published != null && published > 0 };
  });

  results.sort((a, b) => {
    if (a.fits && b.fits) return a.effectiveGallons - b.effectiveGallons; // smallest sufficient first
    if (a.fits) return -1;
    if (b.fits) return 1;
    return b.effectiveGallons - a.effectiveGallons; // closest undersized first
  });
  return results;
}
