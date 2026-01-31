import { scannedCodesService } from "./db";

const MIGRATION_KEY = "barcode-scanner-migrated-to-indexeddb";

export async function migrateFromLocalStorage(): Promise<void> {
  // Check if already migrated
  if (localStorage.getItem(MIGRATION_KEY) === "true") {
    return;
  }

  try {
    // Try to get old data from localStorage
    const oldData = localStorage.getItem("barcode-scanner-storage");

    if (oldData) {
      const parsed = JSON.parse(oldData);
      const scannedCodes = parsed.state?.scannedCodes;

      if (Array.isArray(scannedCodes) && scannedCodes.length > 0) {
        console.log(`Migrating ${scannedCodes.length} codes from localStorage to IndexedDB...`);

        // Migrate each code individually to handle duplicates properly
        for (const code of scannedCodes) {
          try {
            await scannedCodesService.addOrUpdate({
              id: code.id,
              code: code.code,
              timestamp: code.timestamp,
              count: code.count || 1,
              firstScannedAt: code.firstScannedAt || code.timestamp,
            });
          } catch (error) {
            console.warn(`Failed to migrate code ${code.id}:`, error);
            // Continue with next code
          }
        }
        console.log("Migration completed successfully");
      }
    }

    // Mark as migrated
    localStorage.setItem(MIGRATION_KEY, "true");
  } catch (error) {
    console.error("Migration failed:", error);
    // Mark as migrated anyway to avoid repeated attempts
    localStorage.setItem(MIGRATION_KEY, "true");
  }
}
