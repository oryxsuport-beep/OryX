import type { Track } from "../types";

export function searchLibrary(tracks: Track[], query: string, favorites: string[], onlyFavorites = false): Track[] {
  const terms = query.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const favoriteIds = new Set(favorites);
  return tracks.filter(track => {
    if (onlyFavorites && !favoriteIds.has(track.id)) return false;
    const haystack = `${track.title} ${track.artist} ${track.album || ""}`.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}
