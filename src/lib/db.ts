import Dexie, { type EntityTable } from "dexie";

export interface OfflineChunk {
  id?: number;
  evidenceId: string;
  sequenceNumber: number;
  crc32Checksum: string;
  base64Data: string;
  isSynced: boolean;
  createdAt: number;
}

class CourtRecordingDB extends Dexie {
  chunks!: EntityTable<OfflineChunk, "id">;

  constructor() {
    super("CourtRecordingOfflineDB");
    this.version(1).stores({
      chunks: "++id, evidenceId, sequenceNumber, isSynced",
    });
  }
}

export const offlineDb = new CourtRecordingDB();

