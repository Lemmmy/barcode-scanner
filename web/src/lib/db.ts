import Dexie, { type EntityTable } from "dexie";

export interface ScannedCodeDB {
  id: string;
  code: string;
  timestamp: number;
  count: number;
  firstScannedAt: number;
  // Future: arbitrary user-specified fields will be stored here
  customFields?: Record<string, unknown>;
}

const db = new Dexie("BarcodeScannerDB") as Dexie & {
  scannedCodes: EntityTable<ScannedCodeDB, "id">;
};

// Schema definition
db.version(1).stores({
  scannedCodes: "id, code, timestamp, firstScannedAt",
});

export { db };

// Database service layer
export const scannedCodesService = {
  async getAll(): Promise<ScannedCodeDB[]> {
    return await db.scannedCodes.orderBy("timestamp").reverse().toArray();
  },

  async getById(id: string): Promise<ScannedCodeDB | undefined> {
    return await db.scannedCodes.get(id);
  },

  async getByCode(code: string): Promise<ScannedCodeDB | undefined> {
    return await db.scannedCodes.where("code").equals(code).first();
  },

  async add(code: ScannedCodeDB): Promise<string> {
    return await db.scannedCodes.add(code);
  },

  async update(id: string, changes: Partial<ScannedCodeDB>): Promise<number> {
    return await db.scannedCodes.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.scannedCodes.delete(id);
  },

  async clear(): Promise<void> {
    await db.scannedCodes.clear();
  },

  async count(): Promise<number> {
    return await db.scannedCodes.count();
  },

  // Add or update a scanned code (handles duplicates)
  async addOrUpdate(
    code: Omit<ScannedCodeDB, "count" | "firstScannedAt"> &
      Partial<Pick<ScannedCodeDB, "count" | "firstScannedAt">>,
  ): Promise<void> {
    const existing = await this.getByCode(code.code);

    if (existing) {
      // Update existing: increment count and update timestamp
      await this.update(existing.id, {
        count: existing.count + 1,
        timestamp: code.timestamp,
      });
    } else {
      // Add new code
      await this.add({
        ...code,
        count: code.count ?? 1,
        firstScannedAt: code.firstScannedAt ?? code.timestamp,
      });
    }
  },

  // Bulk import (useful for migration)
  async bulkAdd(codes: ScannedCodeDB[]): Promise<void> {
    await db.scannedCodes.bulkAdd(codes);
  },
};
