/** Time capsules store track identifiers, never audio bytes or expiring object URLs. */
export type TimeCapsule = { id: string; title: string; unlockAt: number; trackIds: string[]; createdAt: number };
export function createTimeCapsule(title: string, trackIds: string[], unlockAt: number, now = Date.now()): TimeCapsule {
  const name = title.trim();
  if (!name || name.length > 100) throw new Error('Nome da cápsula inválido');
  if (!Number.isFinite(unlockAt) || unlockAt <= now) throw new Error('Escolha uma data futura');
  const ids = [...new Set(trackIds.filter(x => typeof x === 'string' && x.length > 0))];
  if (!ids.length) throw new Error('Adicione músicas à cápsula');
  return { id: `capsule-${now}-${ids.length}`, title: name, trackIds: ids, unlockAt, createdAt: now };
}
export function openTimeCapsule(capsule: TimeCapsule, now = Date.now()): string[] | null {
  return now >= capsule.unlockAt ? [...capsule.trackIds] : null;
}
