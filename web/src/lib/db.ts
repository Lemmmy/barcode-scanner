import Dexie, { type EntityTable } from "dexie";
import type { DataEntryTemplate } from "../types";

export interface ScannedCodeDB {
  id: string;
  code: string;
  timestamp: number;
  count: number;
  firstScannedAt: number;
  templateData?: Record<string, unknown>;
  fieldOrder?: string[];
}

const db = new Dexie("BarcodeScannerDB") as Dexie & {
  scannedCodes: EntityTable<ScannedCodeDB, "id">;
  templates: EntityTable<DataEntryTemplate, "id">;
};

// Schema definition
db.version(1).stores({
  scannedCodes: "id, code, timestamp, firstScannedAt",
});

// Add templates table in version 2
db.version(2).stores({
  scannedCodes: "id, code, timestamp, firstScannedAt",
  templates: "id, name, createdAt, updatedAt",
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
      // Update existing: increment count, update timestamp, and preserve/update templateData and fieldOrder
      await this.update(existing.id, {
        count: existing.count + 1,
        timestamp: code.timestamp,
        templateData: code.templateData,
        fieldOrder: code.fieldOrder,
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

// Templates service layer
export const templatesService = {
  async getAll(): Promise<DataEntryTemplate[]> {
    return await db.templates.orderBy("createdAt").toArray();
  },

  async getById(id: string): Promise<DataEntryTemplate | undefined> {
    return await db.templates.get(id);
  },

  async add(template: DataEntryTemplate): Promise<string> {
    return await db.templates.add(template);
  },

  async update(id: string, changes: Partial<DataEntryTemplate>): Promise<number> {
    return await db.templates.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.templates.delete(id);
  },

  async clear(): Promise<void> {
    await db.templates.clear();
  },

  async bulkAdd(templates: DataEntryTemplate[]): Promise<void> {
    await db.templates.bulkAdd(templates);
  },
};
