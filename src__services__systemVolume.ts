import { Capacitor, registerPlugin } from "@capacitor/core";

type SystemVolumePlugin = {
  getVolume(): Promise<{ volume: number }>;
  setVolume(options: { volume: number }): Promise<void>;
};

const plugin = registerPlugin<SystemVolumePlugin>("OryXSystemVolume");
export const supportsSystemVolume = Capacitor.getPlatform() === "android";
export async function getSystemVolume(): Promise<number> {
  const { volume } = await plugin.getVolume();
  return Math.max(0, Math.min(1, volume));
}
export async function setSystemVolume(volume: number): Promise<void> {
  await plugin.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
}
