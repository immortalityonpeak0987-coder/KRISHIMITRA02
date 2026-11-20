import fs from 'fs';
import path from 'path';

const isVercel = Boolean(process.env.VERCEL);
const LOCAL_FARM_DIR = isVercel
  ? path.join('/tmp', 'farmer_records')
  : path.resolve(process.cwd(), 'farmer_records');

function ensureDirectory() {
  try {
    if (!fs.existsSync(LOCAL_FARM_DIR)) {
      fs.mkdirSync(LOCAL_FARM_DIR, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

export const localFarmStore = {
  getDirectoryPath() {
    return LOCAL_FARM_DIR;
  },

  saveFarmRecord(farm) {
    if (!farm || !farm.id) return null;
    try {
      if (!ensureDirectory()) return null;
      const safeId = String(farm.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = path.join(LOCAL_FARM_DIR, `${safeId}.json`);
      const payload = {
        ...farm,
        savedToLocalJsonAt: new Date().toISOString()
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');

      // Also update a master index file for easy inspection
      const allFarms = this.loadAllFarmRecords();
      const indexFile = path.join(LOCAL_FARM_DIR, 'all_registered_farms.json');
      fs.writeFileSync(indexFile, JSON.stringify(allFarms, null, 2), 'utf8');
      return filePath;
    } catch {
      return null;
    }
  },

  loadAllFarmRecords() {
    try {
      if (!ensureDirectory()) return [];
      const files = fs.readdirSync(LOCAL_FARM_DIR);
      const farms = [];
      for (const file of files) {
        if (!file.endsWith('.json') || file === 'all_registered_farms.json') continue;
        try {
          const raw = fs.readFileSync(path.join(LOCAL_FARM_DIR, file), 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id) {
            farms.push(parsed);
          }
        } catch {}
      }
      return farms;
    } catch {
      return [];
    }
  },

  deleteFarmRecord(farmId) {
    if (!farmId) return false;
    try {
      if (!ensureDirectory()) return false;
      const safeId = String(farmId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = path.join(LOCAL_FARM_DIR, `${safeId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      const allFarms = this.loadAllFarmRecords();
      const indexFile = path.join(LOCAL_FARM_DIR, 'all_registered_farms.json');
      fs.writeFileSync(indexFile, JSON.stringify(allFarms, null, 2), 'utf8');
      return true;
    } catch {
      return false;
    }
  }
};
