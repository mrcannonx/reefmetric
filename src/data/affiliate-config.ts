// SINGLE SOURCE OF TRUTH for affiliate destinations.
// Every "Check price" button routes through /go/<retailer>?q=<product> (or ?u=<direct-url>
// when we have one — see goHref below). When a program is approved, add its tag/param to
// that retailer's searchUrl below and rebuild — every link on the site updates at once.
// No page edits needed.

export interface Retailer {
  key: string;
  name: string;
  // Trusted host for this retailer — a direct product URL (the `source` field on a data
  // entry, or a ?u= param on /go/<key>) is only ever used if its hostname matches this
  // (exact or subdomain). Anything else silently falls back to the tagged search URL.
  domain: string;
  // Build a search URL for a product query. ADD THE AFFILIATE TAG/PARAM HERE ON APPROVAL.
  searchUrl: (q: string) => string;
}

const enc = (q: string) => encodeURIComponent(q);

export const RETAILERS: Record<string, Retailer> = {
  brs: {
    key: 'brs',
    name: 'Bulk Reef Supply',
    domain: 'bulkreefsupply.com',
    // PENDING APPROVAL (Impact): append the Impact click-tracking params to this URL.
    searchUrl: (q) => `https://www.bulkreefsupply.com/catalogsearch/result/?q=${enc(q)}`,
  },
  aquariumspecialty: {
    key: 'aquariumspecialty',
    name: 'Aquarium Specialty',
    domain: 'aquariumspecialty.com',
    // PENDING APPROVAL: append the Aquarium Specialty affiliate ref (?a=<id> or their format).
    searchUrl: (q) => `https://www.aquariumspecialty.com/catalogsearch/result/?q=${enc(q)}`,
  },
  amazon: {
    key: 'amazon',
    name: 'Amazon',
    domain: 'amazon.com',
    // PENDING APPROVAL: add &tag=<your-associates-tag-20> once Amazon Associates approves.
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

// Display name for the retailer a CTA will land on — so buttons can say "Check price at
// Amazon" instead of a bare "Check price" (Amazon's Associates Operating Agreement requires
// links not obscure that they go to Amazon).
export function retailerName(retailers: string[] = []): string {
  return RETAILERS[pickRetailer(retailers)].name;
}

// Is `hostname` safe to trust as a direct link for retailer `key`? Exact match or subdomain
// only — never a substring match (e.g. "notamazon.com" must not pass for "amazon.com").
export function isHostAllowed(key: string, hostname: string): boolean {
  const domain = RETAILERS[key]?.domain;
  if (!domain) return false;
  const h = hostname.toLowerCase();
  return h === domain || h.endsWith(`.${domain}`);
}

// The internal /go link a CTA should use (base-aware). Pass `directUrl` (most data entries
// already carry one in their `source` field) to land shoppers on the actual product page
// instead of a retailer search — but only if its host matches the resolved retailer's own
// domain; otherwise this silently falls back to the tagged search URL, so it's always safe
// to pass a `source` field of unknown origin.
export function goHref(retailers: string[], query: string, directUrl?: string | null): string {
  const key = pickRetailer(retailers);
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  if (directUrl) {
    try {
      const host = new URL(directUrl).hostname;
      if (isHostAllowed(key, host)) {
        return `${base}/go/${key}?u=${enc(directUrl)}`;
      }
    } catch {
      // malformed URL — fall through to the search link below
    }
  }
  return `${base}/go/${key}?q=${enc(query)}`;
}
