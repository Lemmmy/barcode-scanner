// Default relay server URL for Electron builds
export const DEFAULT_RELAY_SERVER_ELECTRON = "https://bs.lem.sh";

// Get default relay server URL based on environment
export function getDefaultRelayServerUrl(): string {
  // Check if running in Electron
  if (window.electronAPI) {
    return DEFAULT_RELAY_SERVER_ELECTRON;
  }

  // For web builds, use current origin
  return window.location.origin;
}
