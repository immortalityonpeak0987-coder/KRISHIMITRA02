/**
 * Report Data Aggregator
 * Synthesizes farm details, standardized environment, risk screenings, and crop plans
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import mongoose from 'mongoose';
import { Farm } from '../../models/Farm.js';
import { RecoveryRecord } from '../../models/RecoveryRecord.js';
import { SoilTest } from '../../models/SoilTest.js';
import { EnvironmentalStandardizationService } from '../environment/environmentalStandardizationService.js';
import { RiskAssessmentService } from '../risk/riskAssessmentService.js';
import { CropIntelligenceService } from '../crop-intelligence/cropIntelligenceService.js';

export class ReportDataAggregator {
  static async compileReportData(farmId, options = {}) {
    let farm = null;
    let soilTests = [];
    let recoveryTimeline = [];

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.isValidObjectId(farmId)) {
          farm = await Farm.findById(farmId).lean();
        } else {
          farm = await Farm.findOne({ demoId: farmId }).lean();
        }
        if (farm) {
          soilTests = await SoilTest.find({ farm: farm._id }).sort({ testDate: -1 }).limit(5).lean();
          recoveryTimeline = await RecoveryRecord.find({ farm: farm._id }).sort({ eventDate: -1 }).limit(10).lean();
        }
      } catch {
        // Disconnected mode fallback
      }
    }

    if (!farm) {
      // Mock / fallback profile for standalone report testing
      farm = {
        _id: farmId,
        id: farmId,
        farmName: 'West Bengal Demonstration Farm',
        farmerName: 'Local Farmer / Demonstration Plot',
        district: 'Purba Bardhaman',
        locationName: 'Gangetic Agricultural Belt',
        area: { value: 4.5, unit: 'Bigha' },
        currentCrop: 'Aman Paddy'
      };
    }

    // 1. Environmental Data (Module 1)
    let environment = null;
    try {
      environment = await EnvironmentalStandardizationService.getFarmEnvironmentalProfile(farmId, options);
    } catch (e) {
      environment = { error: 'Environmental profile unavailable', details: e.message };
    }

    // 2. Agricultural Risk Screenings (Module 2)
    let risks = null;
    try {
      risks = await RiskAssessmentService.assessFarm(farmId, options);
    } catch (e) {
      risks = { error: 'Risk assessment unavailable', details: e.message };
    }

    // 3. Crop Intelligence & Rotation (Module 3)
    let cropRotation = null;
    try {
      cropRotation = CropIntelligenceService.getRotationRecommendations(farmId, farm.currentCrop);
    } catch (e) {
      cropRotation = { error: 'Crop recommendations unavailable', details: e.message };
    }

    return {
      reportId: `KM-REP-${farmId}-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date(),
      farm: {
        id: farm._id ? farm._id.toString() : farm.id,
        farmName: farm.farmName,
        farmerName: farm.farmerName,
        district: farm.district,
        locationName: farm.locationName,
        area: farm.area,
        currentCrop: farm.currentCrop
      },
      environment: environment?.aggregated || {},
      risks: risks?.data || {},
      cropRotation: cropRotation?.data || {},
      soilTests: soilTests.slice(0, 3),
      recoveryTimeline: recoveryTimeline.slice(0, 5),
      sourcesAttribution: [
        'NASA Langley Research Center POWER Project',
        'NASA GES DISC GPM IMERG Precipitation',
        'NASA JPL SMAP Soil Moisture',
        'NASA LP DAAC MODIS Terra NDVI',
        'India Meteorological Department (IMD)',
        'West Bengal Crop Planning Calendar & Regional Reference'
      ]
    };
  }
}
