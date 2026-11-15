/** Catalog grouping: preserve genuine edits while hiding duplicate listings. */
export type MusicVersion = 'original' | 'slowed' | 'sped-up' | 'nightcore' | 'remix' | 'live' | 'acoustic';
export type CatalogItem = { id: string; title: string; artist: string; duration?: string };
const strip = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function detectVersion(title: string): MusicVersion {
  if (/\b(slowed|slow reverb|slowed reverb|slow\s*\+\s*reverb)\b/i.test(title)) return 'slowed';
  if (/\b(sped[\s-]*up|speed[\s-]*up|speedup|accelerated)\b/i.test(title)) return 'sped-up';
  if (/\bnightcore\b/i.test(title)) return 'nightcore';
  if (/\b(remix|bootleg|edit|rework)\b/i.test(title)) return 'remix';
  if (/\b(live|ao vivo)\b/i.test(title)) return 'live';
  if (/\b(acoustic|acustic[ao])\b/i.test(title)) return 'acoustic';
  return 'original';
}
export function baseTitle(title: string): string {
  return strip(title.replace(/\([^)]*(slowed|sped[\s-]*up|speed[\s-]*up|nightcore|remix|reverb|live|acoustic)[^)]*\)/gi, ' ')
    .replace(/\[[^\]]*(slowed|sped[\s-]*up|speed[\s-]*up|nightcore|remix|reverb|live|acoustic)[^\]]*\]/gi, ' ')
    .replace(/\s*[-–|]\s*(slowed(?:\s*\+\s*reverb)?|sped[\s-]*up|speed[\s-]*up|nightcore|remix|live|acoustic).*$/i, ''));
}
export function catalogKey(item: Pick<CatalogItem, 'title' | 'artist'>): string {
  return `${strip(item.artist)}|${baseTitle(item.title)}|${detectVersion(item.title)}`;
}
/** Normalize common duration formats so 3:20 and 200 seconds compare equally. */
export function durationSeconds(duration: string | undefined): number | undefined {
  if (!duration) return undefined;
  const value = duration.trim();
  if (/^\d+$/.test(value)) {
    const seconds = Number(value);
    return Number.isSafeInteger(seconds) ? seconds : undefined;
  }
  if (!/^\d+(?::[0-5]\d){1,2}$/.test(value)) return undefined;
  const seconds = value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  return Number.isSafeInteger(seconds) ? seconds : undefined;
}
export function uniqueCatalog<T extends CatalogItem>(items: T[]): T[] {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  return items.filter(item => {
    const key = catalogKey(item);
    // Same title/artist/version may be a different recording; only collapse when duration agrees.
    // Unknown durations must not collapse different recordings just because their titles match.
    const seconds = durationSeconds(item.duration);
    const preciseKey = seconds !== undefined ? `${key}|${seconds}` : `${key}|id:${item.id}`;
    if (seenIds.has(item.id) || seenKeys.has(preciseKey)) return false;
    seenIds.add(item.id);
    seenKeys.add(preciseKey);
    return true;
  });
}
