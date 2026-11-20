import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Farm, Crop, CropRotation, SoilTest, EnvironmentalObservation, RiskAssessment, RecoveryRecord, Report, ApiCache } from '../models/index.js';

export async function cleanDemoData({ silent = false } = {}) {
  // Safety rule: Refuse execution in production
  if (config.isProduction) {
    throw new Error('[Safety Violation] Cleaning demonstration records is prohibited in production mode.');
  }

  if (!silent) {
    console.log('================================================================');
    console.log('  KRISHI-MITRA Safe Demo Cleanup                                  ');
    console.log('  Scope: Deletes ONLY records with dataOrigin === "DEMO"        ');
    console.log('================================================================');
  }

  if (mongoose.connection.readyState !== 1) {
    await connectDatabase();
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error('[Clean Error] Cannot clean: MongoDB connection is not active.');
  }

  // Delete ONLY documents where dataOrigin is explicitly 'DEMO'
  const filter = { dataOrigin: 'DEMO' };

  const [
    farmsResult,
    cropsResult,
    rotationsResult,
    soilResult,
    envResult,
    riskResult,
    recoveryResult,
    reportResult
  ] = await Promise.all([
    Farm.deleteMany(filter),
    Crop.deleteMany(filter),
    CropRotation.deleteMany(filter),
    SoilTest.deleteMany(filter),
    EnvironmentalObservation.deleteMany(filter),
    RiskAssessment.deleteMany(filter),
    RecoveryRecord.deleteMany(filter),
    Report.deleteMany(filter)
  ]);

  const summary = {
    farmsDeleted: farmsResult.deletedCount,
    cropsDeleted: cropsResult.deletedCount,
    rotationsDeleted: rotationsResult.deletedCount,
    soilTestsDeleted: soilResult.deletedCount,
    observationsDeleted: envResult.deletedCount,
    riskAssessmentsDeleted: riskResult.deletedCount,
    recoveryRecordsDeleted: recoveryResult.deletedCount,
    reportsDeleted: reportResult.deletedCount
  };

  if (!silent) {
    console.log('[Cleanup Result] Demo records removed safely:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('User records (dataOrigin !== "DEMO") were completely preserved.');
    console.log('================================================================');
  }

  return summary;
}

// Direct CLI invocation
if (process.argv[1] && process.argv[1].endsWith('clean.js')) {
  cleanDemoData()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Clean Fatal Error]', err.message);
      await disconnectDatabase();
      process.exit(1);
    });
}
