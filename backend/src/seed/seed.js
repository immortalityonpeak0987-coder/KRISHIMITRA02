import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Farm, Crop, CropRotation, SoilTest } from '../models/index.js';
import {
  DEMO_FARMS_SEED,
  DEMO_CROPS_SEED,
  DEMO_SOIL_TESTS_SEED,
  DEMO_ROTATIONS_SEED
} from './seedData.js';

export async function runSeed({ silent = false } = {}) {
  // Safety rule 1: Refuse execution in production
  if (config.isProduction) {
    throw new Error('[Seed Safety Violation] Seeding demonstration records is strictly prohibited in production mode.');
  }

  if (!silent) {
    console.log('================================================================');
    console.log('  KRISHI-MITRA Safe Development Database Seeder                  ');
    console.log('  Environment : development                                    ');
    console.log('================================================================');
  }

  // Ensure active database connection
  if (mongoose.connection.readyState !== 1) {
    await connectDatabase();
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error('[Seed Error] Cannot seed: MongoDB connection is not active.');
  }

  const results = {
    farms: { created: 0, updated: 0 },
    crops: { created: 0, updated: 0 },
    soilTests: { created: 0, updated: 0 },
    rotations: { created: 0, updated: 0 }
  };

  // 1. Seed Farms (Idempotent upsert by unique demoId)
  const farmIdMap = {};
  for (const farmData of DEMO_FARMS_SEED) {
    const existing = await Farm.findOne({ demoId: farmData.demoId });
    if (existing) {
      Object.assign(existing, farmData);
      await existing.save();
      farmIdMap[farmData.demoId] = existing._id;
      results.farms.updated++;
    } else {
      const created = await Farm.create(farmData);
      farmIdMap[farmData.demoId] = created._id;
      results.farms.created++;
    }
  }

  // 2. Seed Crops (Idempotent upsert by cropName)
  for (const cropData of DEMO_CROPS_SEED) {
    const existing = await Crop.findOne({ cropName: cropData.cropName });
    if (existing) {
      Object.assign(existing, cropData);
      await existing.save();
      results.crops.updated++;
    } else {
      await Crop.create(cropData);
      results.crops.created++;
    }
  }

  // 3. Seed Soil Tests (Linked via farmIdMap; upsert by laboratoryReference)
  for (const soilData of DEMO_SOIL_TESTS_SEED) {
    const farmId = farmIdMap[soilData.farmDemoId];
    if (farmId) {
      const record = { ...soilData, farm: farmId };
      delete record.farmDemoId;

      const existing = await SoilTest.findOne({ laboratoryReference: record.laboratoryReference });
      if (existing) {
        Object.assign(existing, record);
        await existing.save();
        results.soilTests.updated++;
      } else {
        await SoilTest.create(record);
        results.soilTests.created++;
      }
    }
  }

  // 4. Seed Crop Rotations (Linked via farmIdMap; upsert by farm and year)
  for (const rotData of DEMO_ROTATIONS_SEED) {
    const farmId = farmIdMap[rotData.farmDemoId];
    if (farmId) {
      const record = { ...rotData, farm: farmId };
      delete record.farmDemoId;

      const existing = await CropRotation.findOne({ farm: farmId, year: record.year });
      if (existing) {
        Object.assign(existing, record);
        await existing.save();
        results.rotations.updated++;
      } else {
        await CropRotation.create(record);
        results.rotations.created++;
      }
    }
  }

  if (!silent) {
    console.log('[Seed] Seeding completed cleanly:');
    console.log(`  - Farms       : ${results.farms.created} created, ${results.farms.updated} updated`);
    console.log(`  - Crops       : ${results.crops.created} created, ${results.crops.updated} updated`);
    console.log(`  - Soil Tests  : ${results.soilTests.created} created, ${results.soilTests.updated} updated`);
    console.log(`  - Rotations   : ${results.rotations.created} created, ${results.rotations.updated} updated`);
    console.log('================================================================');
  }

  return results;
}

// Direct CLI invocation
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed Fatal Error]', err.message);
      await disconnectDatabase();
      process.exit(1);
    });
}
