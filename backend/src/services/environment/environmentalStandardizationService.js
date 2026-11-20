/**
 * Environmental Standardization Service
 * Orchestrates multi-source ingestion, normalization, quality evaluation, and aggregation
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import mongoose from 'mongoose';
import { EnvironmentalObservation } from '../../models/EnvironmentalObservation.js';
import { Farm } from '../../models/Farm.js';
import { EnvironmentalNormalizer } from './environmentalNormalizer.js';
import { EnvironmentalQualityService } from './environmentalQualityService.js';
import { EnvironmentalAggregationService } from './environmentalAggregationService.js';
import { STANDARD_PARAMETERS } from './environmentalConstants.js';

export class EnvironmentalStandardizationService {
  /**
   * Standardizes an array of raw observations
   */
  static standardizeRecords(rawRecords) {
    if (!Array.isArray(rawRecords)) {
      throw new Error('rawRecords must be an array');
    }
    return rawRecords.map(raw => EnvironmentalNormalizer.normalizeObservation(raw));
  }

  /**
   * Retrieves and standardizes environmental observations for a farm
   */
  static async getFarmEnvironmentalProfile(farmId, options = {}) {
    const {
      startDate,
      endDate,
      parameters,
      aggregation = 'summary'
    } = options;

    let farm = null;
    let records = [];

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.isValidObjectId(farmId)) {
          farm = await Farm.findById(farmId).lean();
        } else {
          farm = await Farm.findOne({ demoId: farmId }).lean();
        }

        const query = {};
        if (farm) {
          query.farm = farm._id;
        }

        if (startDate || endDate) {
          query.observationDate = {};
          if (startDate) query.observationDate.$gte = new Date(startDate);
          if (endDate) query.observationDate.$lte = new Date(endDate);
        }

        records = await EnvironmentalObservation.find(query).sort({ observationDate: -1 }).lean();
      } catch {
        records = [];
      }
    }

    // Standardize retrieved records
    const standardized = records.map(r => {
      const norm = EnvironmentalNormalizer.normalizeObservation(r);
      const qual = EnvironmentalQualityService.evaluateObservation(norm);
      return {
        ...norm,
        qualityState: qual.qualityState,
        qualityDescription: qual.description
      };
    });

    // Filter by parameters if specified
    const filtered = parameters && parameters.length > 0
      ? standardized.filter(s => parameters.includes(s.parameter))
      : standardized;

    // Spatial Footprint analysis
    const farmAreaHa = farm?.area?.value ? (farm.area.unit === 'Bigha' ? farm.area.value * 0.1338 : farm.area.value) : 1.0;
    const spatialAssessments = {
      nasaPower: EnvironmentalQualityService.assessSpatialFootprint(farmAreaHa, '0.5° (~50km)'),
      smap: EnvironmentalQualityService.assessSpatialFootprint(farmAreaHa, '9km'),
      gpmImerg: EnvironmentalQualityService.assessSpatialFootprint(farmAreaHa, '0.1° (~10km)'),
      modis: EnvironmentalQualityService.assessSpatialFootprint(farmAreaHa, '250m')
    };

    // Aggregations
    const aggregated = EnvironmentalAggregationService.aggregate(filtered, {
      aggregation,
      startDate,
      endDate
    });

    return {
      farmId,
      farmName: farm?.farmName || null,
      district: farm?.district || null,
      coordinates: farm?.coordinates || null,
      analysisPeriod: {
        startDate: startDate || (records.length > 0 ? records[records.length - 1].observationDate : null),
        endDate: endDate || (records.length > 0 ? records[0]?.observationDate : null)
      },
      spatialAssessments,
      aggregated,
      recentObservations: filtered.slice(0, 50),
      metadata: {
        totalRecords: filtered.length,
        disclaimer: 'Standardized observations preserve original source metadata, physical units, and quality flags. Coarse satellite/model pixels carry spatial resolution caveats.'
      }
    };
  }

  /**
   * Idempotently persists standardized observations to MongoDB
   */
  static async persistObservations(farmId, standardizedObservations) {
    if (!Array.isArray(standardizedObservations) || standardizedObservations.length === 0) {
      return { persistedCount: 0 };
    }

    const docs = standardizedObservations.map(obs => ({
      farm: farmId,
      parameter: obs.parameter,
      value: obs.standardizedValue,
      unit: obs.standardizedUnit,
      sourceName: obs.source,
      sourceProduct: obs.sourceProduct,
      observationDate: obs.observationDate,
      retrievalDate: obs.retrievalTimestamp || new Date(),
      spatialResolution: obs.spatialResolution,
      temporalResolution: obs.temporalResolution,
      qualityFlag: obs.qualityState === 'VALID' ? 'NOMINAL' : (obs.qualityState === 'MISSING' ? 'MISSING' : 'SUSPECT'),
      dataOrigin: obs.dataOrigin,
      metadata: obs.metadata || {}
    }));

    try {
      const res = await EnvironmentalObservation.insertMany(docs, { ordered: false });
      return { persistedCount: res.length };
    } catch (err) {
      // Return count of successfully inserted documents in case of partial duplicates
      return { persistedCount: err.insertedDocs?.length || 0, warning: 'Partial duplicates bypassed' };
    }
  }
}
