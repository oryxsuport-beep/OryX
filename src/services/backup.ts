export type OryXBackup = {
  format: 'oryx-settings'; version: 1; exportedAt: string;
  profile: { displayName: string; accent: string; motion: boolean };
  favorites: string[]; recent: string[]; playCounts: Record<string, number>;
};
const safeStrings = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((v): v is string => typeof v === 'string' && v.length <= 500))].slice(0, 5000) : [];
export function createBackup(input: Omit<OryXBackup, 'format'|'version'|'exportedAt'>): OryXBackup {
  return { format: 'oryx-settings', version: 1, exportedAt: new Date().toISOString(), ...input };
}
export function parseBackup(raw: string): OryXBackup {
  if (raw.length > 2_000_000) throw new Error('Backup muito grande.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Arquivo JSON inválido.'); }
  if (!value || typeof value !== 'object') throw new Error('Backup inválido.');
  const obj = value as Record<string, unknown>;
  if (obj.format !== 'oryx-settings' || obj.version !== 1) throw new Error('Formato de backup incompatível.');
  const profile = obj.profile;
  if (!profile || typeof profile !== 'object') throw new Error('Perfil ausente.');
  const p = profile as Record<string, unknown>;
  if (typeof p.displayName !== 'string' || p.displayName.length > 40 ||
      typeof p.accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(p.accent) ||
      typeof p.motion !== 'boolean') throw new Error('Dados do perfil inválidos.');
  const counts: Record<string, number> = {};
  if (obj.playCounts && typeof obj.playCounts === 'object' && !Array.isArray(obj.playCounts)) {
    for (const [key, count] of Object.entries(obj.playCounts)) {
      if (key.length <= 500 && typeof count === 'number' && Number.isSafeInteger(count) && count >= 0)
        counts[key] = count;
    }
  }
  return {
    format: 'oryx-settings', version: 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt.slice(0, 40) : '',
    profile: { displayName: p.displayName, accent: p.accent, motion: p.motion },
    favorites: safeStrings(obj.favorites), recent: safeStrings(obj.recent), playCounts: counts
  };
}
