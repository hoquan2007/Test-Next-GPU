import fs from "fs/promises";
import path from "path";
import { config } from "../config";
import { StorageDriver, StorageResult } from "./storage.interface";

export class LocalStorageDriver implements StorageDriver {
  private baseDir: string;

  constructor(baseDir = config.storage.uploadDir) {
    this.baseDir = baseDir;
  }

  async save(file: Buffer, relativePath: string, _mimeType: string): Promise<StorageResult> {
    const fullPath = path.join(this.baseDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file);

    return {
      storagePath: relativePath,
      publicUrl: this.getPublicUrl(relativePath),
      fileSizeBytes: file.length,
    };
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, relativePath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File may already be deleted
    }
  }

  getPublicUrl(relativePath: string): string {
    return `/uploads/${relativePath.replace(/\\/g, "/")}`;
  }
}

export function createStorageDriver(): StorageDriver {
  if (config.storage.driver === "s3") {
    throw new Error("S3 storage driver chưa được cấu hình. Dùng STORAGE_DRIVER=local.");
  }
  return new LocalStorageDriver();
}
