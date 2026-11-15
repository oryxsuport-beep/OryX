/** Decide player gestures without interfering with vertical page scrolling. */
export type Gesture = 'next' | 'previous' | 'none';
export function classifyPlayerSwipe(deltaX: number, deltaY: number, threshold = 65): Gesture {
  if (![deltaX, deltaY, threshold].every(Number.isFinite) || threshold <= 0) return 'none';
  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return 'none';
  return deltaX < 0 ? 'next' : 'previous';
}
