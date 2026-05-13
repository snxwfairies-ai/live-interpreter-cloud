import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId:   "com.snxwfairies.liveinterpreter",
  appName: "Live Interpreter",
  webDir:  "dist",
  server:  { androidScheme: "https", cleartext: true },
  android: {
    allowMixedContent:           true,
    captureInput:                true,
    webContentsDebuggingEnabled: false,
    backgroundColor:             "#060B18",
  },
};
export default config;
