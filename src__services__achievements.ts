/** Local-only achievements. No tracking or server account required. */
export type Achievement = 'first-play' | 'music-lover' | 'explorer' | 'collector';
export function calculateAchievements(playCounts: Record<string, number>, favorites: string[], genresExplored: number): Achievement[] {
  const plays = Object.values(playCounts).reduce((sum, n) => sum + (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0), 0);
  const result: Achievement[] = [];
  if (plays >= 1) result.push('first-play');
  if (plays >= 100) result.push('music-lover');
  if (genresExplored >= 5) result.push('explorer');
  if (new Set(favorites).size >= 10) result.push('collector');
  return result;
}
