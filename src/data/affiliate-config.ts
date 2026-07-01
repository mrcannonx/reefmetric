// SINGLE SOURCE OF TRUTH for affiliate destinations.
// Every "Check price" button routes through /go/<retailer>?q=<product>.
// When a program is approved, add its tag/param to that retailer's searchUrl below and
// rebuild — every link on the site updates at once. No page edits needed.

export interface Retailer {
  key: string;
  name: string;
  // Build a search URL for a product query. ADD THE AFFILIATE TAG/PARAM HERE ON APPROVAL.
  searchUrl: (q: string) => string;
}

const enc = (q: string) => encodeURIComponent(q);

export const RETAILERS: Record<string, Retailer> = {
  brs: {
    key: 'brs',
    name: 'Bulk Reef Supply',
    // APPROVAL TODO (Impact): append the Impact click-tracking params to this URL.
    searchUrl: (q) => `https://www.bulkreefsupply.com/catalogsearch/result/?q=${enc(q)}`,
  },
  aquariumspecialty: {
    key: 'aquariumspecialty',
    name: 'Aquarium Specialty',
    // APPROVAL TODO: append the Aquarium Specialty affiliate ref (?a=<id> or their format).
    searchUrl: (q) => `https://www.aquariumspecialty.com/catalogsearch/result/?q=${enc(q)}`,
  },
  amazon: {
    key: 'amazon',
    name: 'Amazon',
    // APPROVAL TODO: add &tag=<your-associates-tag-20> once Amazon Associates approves.
    searchUrl: (q) => `https://www.amazon.com/s?k=${enc(q)}`,
  },
};

// Which retailer to route a product to — prefer the highest-value program we're in.
export function pickRetailer(retailers: string[] = []): string {
  const has = (needle: string) => retailers.some((r) => r.toLowerCase().includes(needle));
  if (has('bulk reef')) return 'brs';
  if (has('aquarium specialty')) return 'aquariumspecialty';
  return 'amazon'; // broadest availability / catch-all
}

// The internal /go link a CTA should use (base-aware).
export function goHref(retailers: string[], query: string): string {
  const key = pickRetailer(retailers);
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}/go/${key}?q=${enc(query)}`;
}
