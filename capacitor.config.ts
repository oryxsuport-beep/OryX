import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.oryx.music",
  appName: "OryX",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    backgroundColor: "#09090b"
  }
};

export default config;
