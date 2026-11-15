import type { Track } from "../types";
import { baseTitle } from "./catalog";

export type SmartNextMode = "familiar" | "balanced" | "explore";

/** Recommends only playable items already in the user's queue; never bypasses licensing. */
export function recommendNext(
  tracks: Track[], currentId: string | undefined, liked: string[], recent: string[], mode: SmartNextMode
): Track | undefined {
  const current = tracks.find(track => track.id === currentId);
  const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const sameSong = (a: Track, b: Track) => normalize(a.artist) === normalize(b.artist)
    && baseTitle(a.title) === baseTitle(b.title);
  // Prefer a genuinely different song over another speed/remix variant of the current one.
  const playable = tracks.filter(track => track.id !== currentId && Boolean(track.src));
  const distinct = current ? playable.filter(track => !sameSong(track, current)) : playable;
  const candidates = distinct.length ? distinct : playable;
  if (!candidates.length) return undefined;
  const recentSet = new Set(recent.slice(0, 12));
  // Avoid recently played tracks and their alternate edits while fresh choices exist.
  // Fall back to the full set when the user has listened to everything.
  const fresh = candidates.filter(track => !recentSet.has(track.id) &&
    !tracks.some(previous => recentSet.has(previous.id) && sameSong(previous, track)));
  const pool = fresh.length ? fresh : candidates;
  const likedSet = new Set(liked);
  const score = (track: Track) => {
    const sameArtist = !!current && current.artist !== "Arquivo local" && current.artist !== "Streaming online" && track.artist === current.artist;
    const tokens = (s: string) => s.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(t => t.length > 3);
    const overlap = current ? tokens(track.title).filter(t => tokens(current.title).includes(t)).length : 0;
    const familiar = (likedSet.has(track.id) ? 4 : 0) + (sameArtist ? 3 : 0) + Math.min(overlap, 2);
    const recentPenalty = recentSet.has(track.id) ? -8 : 0;
    const recentVariantPenalty = tracks.some(previous => recentSet.has(previous.id) && sameSong(previous, track)) ? -5 : 0;
    const novelty = 2 + recentPenalty + recentVariantPenalty;
    const weight = mode === "familiar" ? 3 : mode === "explore" ? 0.3 : 1.2;
    return familiar * weight + novelty * (mode === "explore" ? 3 : 1);
  };
  // Stable tie-breaking avoids random, jarring transitions.
  return pool.reduce((best, candidate) => score(candidate) > score(best) ? candidate : best);
}
