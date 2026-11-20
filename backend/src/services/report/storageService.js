/**
 * Storage Service Abstraction
 * Supports LOCAL filesystem storage fallback and cloud object storage interfaces
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import fs from 'fs';
import path from 'path';
import { STORAGE_PROVIDERS } from './reportConstants.js';

export class StorageService {
  static getStorageDir() {
    const dir = process.env.VERCEL
      ? path.join('/tmp', 'storage/reports')
      : path.resolve('storage/reports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  static async saveFile(filename, buffer) {
    // Local storage provider (default development fallback)
    const storageDir = this.getStorageDir();
    const filePath = path.join(storageDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    return {
      provider: STORAGE_PROVIDERS.LOCAL,
      storageKey: filename,
      filePath
    };
  }

  static async getFile(storageKey) {
    const storageDir = this.getStorageDir();
    const filePath = path.join(storageDir, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Report file not found: ${storageKey}`);
    }
    return fs.promises.readFile(filePath);
  }

  static async deleteFile(storageKey) {
    const storageDir = this.getStorageDir();
    const filePath = path.join(storageDir, storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}
