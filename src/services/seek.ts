/** Find a seekable time without jumping into an unavailable media gap. */
export function clampSeekTime(requested: number, duration: number, ranges: ReadonlyArray<readonly [number, number]>): number | null {
  if (!Number.isFinite(requested) || !ranges.length) return null;
  const valid = ranges.filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end >= start && start >= 0);
  if (!valid.length) return null;
  const endOfMedia = Number.isFinite(duration) && duration >= 0 ? duration : Infinity;
  const target = Math.max(0, Math.min(endOfMedia, requested));
  for (const [start, end] of valid) if (target >= start && target <= end) return target;
  const boundaries = valid.flatMap(([start, end]) => [start, Math.min(end, endOfMedia)]).filter(n => n <= endOfMedia);
  if (!boundaries.length) return null;
  return boundaries.reduce((closest, candidate) => Math.abs(candidate - target) < Math.abs(closest - target) ? candidate : closest);
}
