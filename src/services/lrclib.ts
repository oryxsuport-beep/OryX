import type { LyricsResult } from "../types";

const API = "https://lrclib.net/api";

/** Looks up a track in LRCLIB. Duration is optional but improves matching. */
export async function findLyrics(
  trackName: string,
  artistName: string,
  duration?: number,
  signal?: AbortSignal
): Promise<LyricsResult | null> {
  const params = new URLSearchParams({ track_name: trackName });
  if (artistName.trim()) params.set("artist_name", artistName.trim());
  if (duration && Number.isFinite(duration)) {
    params.set("duration", String(Math.round(duration)));
  }

  // /get is best for an exact artist + title match. When the artist is
  // unknown (common for local files), use /search and select a close result.
  if (artistName.trim()) {
    const response = await fetch(`${API}/get?${params.toString()}`, {
      signal,
      headers: { "X-User-Agent": "OryX/1.0.0 (Android music player)" }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`LRCLIB respondeu com HTTP ${response.status}`);
    return await response.json() as LyricsResult;
  }

  const response = await fetch(`${API}/search?${params.toString()}`, {
    signal,
    headers: { "X-User-Agent": "OryX/1.0.0 (Android music player)" }
  });
  if (!response.ok) throw new Error(`LRCLIB respondeu com HTTP ${response.status}`);
  const results = await response.json() as LyricsResult[];
  if (!results.length) return null;

  if (duration && Number.isFinite(duration)) {
    return results.reduce((best, item) =>
      Math.abs(item.duration - duration) < Math.abs(best.duration - duration) ? item : best
    );
  }
  return results[0];
}

export type LyricLine = { time: number; text: string };

export function parseSyncedLyrics(input: string | null): LyricLine[] {
  if (!input) return [];
  const lines: LyricLine[] = [];
  const pattern = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\](.*)/g;

  for (const rawLine of input.split(/\r?\n/)) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(rawLine)) !== null) {
      const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
      lines.push({
        time: Number(match[1]) * 60 + Number(match[2]) + fraction,
        text: match[4].trim()
      });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}
