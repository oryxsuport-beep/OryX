import type { Track } from "../types";
export type Vibe = "energia" | "calma" | "madrugada" | "brasil" | "mundo";
const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const vibeWords: Record<Vibe, string[]> = {
  energia: ["dance", "funk", "edm", "party", "rock", "speed", "remix"],
  calma: ["acoustic", "lofi", "chill", "relax", "slow", "ambient"],
  madrugada: ["night", "noite", "madrugada", "slowed", "dream"],
  brasil: ["brasil", "brasileiro", "sertanejo", "funk", "pagode", "samba", "forro"],
  mundo: ["pop", "world", "indie", "jazz", "afro", "latin"]
};
export function chooseVibe(tracks: Track[], vibe: Vibe): Track[] {
  const words = vibeWords[vibe];
  return tracks.filter(track => words.some(word => normalize(`${track.title} ${track.artist}`).includes(word)));
}
export function dailyDrop(tracks: Track[], liked: string[], recent: string[], limit = 5): Track[] {
  const likedSet = new Set(liked), recentSet = new Set(recent);
  return [...tracks].sort((a, b) => {
    const score = (track: Track) => (likedSet.has(track.id) ? 3 : 0) - (recentSet.has(track.id) ? 1 : 0);
    return score(b) - score(a) || a.title.localeCompare(b.title);
  }).slice(0, limit);
}
export function buildReplay(tracks: Track[], counts: Record<string, number>, liked: string[]) {
  const topTrack = [...tracks].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))[0];
  return { totalPlays: Object.values(counts).reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0), topTrack: topTrack && counts[topTrack.id] ? topTrack : null, favorites: liked.length };
}
export function makeShareText(tracks: Track[], liked: string[], displayName: string) {
  const chosen = tracks.filter(track => liked.includes(track.id));
  return `🎧 Seleção de ${displayName} no OryX\n` + (chosen.length ? chosen.map(track => `• ${track.title} — ${track.artist}`).join("\n") : "Ainda sem favoritas");
}
