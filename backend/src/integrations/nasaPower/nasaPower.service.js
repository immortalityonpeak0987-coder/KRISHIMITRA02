import mongoose from 'mongoose';
import {
  NASA_POWER_CONFIG,
  NASA_POWER_PARAMETERS,
  DEFAULT_PARAMETERS,
  INTEGRATION_STATUS,
  SCIENTIFIC_DISCLAIMER
} from './nasaPower.constants.js';
import {
  validateCoordinates,
  validateDateRange,
  validateParameters,
  validateObjectId
} from './nasaPower.validators.js';
import { nasaPowerClient } from './nasaPower.client.js';
import { normalizeNasaPowerResponse } from './nasaPower.normalizer.js';
import { ApiCache } from '../../models/ApiCache.js';
import { Farm } from '../../models/Farm.js';
import { EnvironmentalObservation } from '../../models/EnvironmentalObservation.js';

/**
 * Generates a deterministic cache key for NASA POWER queries
 */
export function generateCacheKey({ latitude, longitude, start, end, parameters }) {
  const latStr = Number(latitude).toFixed(4);
  const lonStr = Number(longitude).toFixed(4);
  const sortedParams = [...parameters].sort().join(',');
  return `nasa_power_daily_${latStr}_${lonStr}_${start}_${end}_${sortedParams}`;
}

export class NasaPowerService {
  constructor(options = {}) {
    this.client = options.client || nasaPowerClient;
    this.cacheTtlMs = options.cacheTtlMs || NASA_POWER_CONFIG.CACHE_TTL_MS;
  }

  /**
   * Retrieves NASA POWER data for a specific geographic coordinate pair
   * 
   * @param {object} params
   * @param {number|string} params.latitude
   * @param {number|string} params.longitude
   * @param {string} params.startDate YYYY-MM-DD or YYYYMMDD
   * @param {string} params.endDate YYYY-MM-DD or YYYYMMDD
   * @param {string|string[]} [params.parameters]
   * @param {string} [params.farmId] Optional associated farm ObjectId
   * @returns {Promise<object>}
   */
  async getPointData({ latitude, longitude, startDate, endDate, parameters, farmId = null }) {
    // 1. Validate Coordinates
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      return {
        success: false,
        statusCode: 400,
        integrationStatus: coordValidation.statusCode,
        error: coordValidation.error
      };
    }

    // 2. Validate Date Range
    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      return {
        success: false,
        statusCode: 400,
        integrationStatus: dateValidation.statusCode,
        error: dateValidation.error
      };
    }

    // 3. Validate Parameters
    const paramValidation = validateParameters(parameters);
    if (!paramValidation.isValid) {
      return {
        success: false,
        statusCode: 400,
        integrationStatus: paramValidation.statusCode,
        error: paramValidation.error
      };
    }

    const { latitude: lat, longitude: lon } = coordValidation;
    const { start, end } = dateValidation;
    const paramsList = paramValidation.parameters;

    const cacheKey = generateCacheKey({
      latitude: lat,
      longitude: lon,
      start,
      end,
      parameters: paramsList
    });

    const isDbConnected = mongoose.connection.readyState === 1;

    // 4. Cache Lookup (if database is connected)
    if (isDbConnected) {
      try {
        const cachedDoc = await ApiCache.findOne({
          cacheKey,
          expiresAt: { $gt: new Date() },
          status: 'VALID'
        }).lean();

        if (cachedDoc && cachedDoc.responseData) {
          const cachedData = cachedDoc.responseData;

          // If farmId is supplied and DB connected, persist observations to farm if not already done
          let persistenceStatus = 'NOT_APPLICABLE';
          if (farmId) {
            persistenceStatus = await this.persistObservationsToFarm(farmId, cachedData.flatObservations);
          }

          return {
            success: true,
            statusCode: 200,
            integrationStatus: INTEGRATION_STATUS.CACHE_HIT,
            source: 'NASA_POWER',
            cached: true,
            cachedAt: cachedDoc.fetchedAt,
            expiresAt: cachedDoc.expiresAt,
            persistenceStatus,
            data: cachedData
          };
        }
      } catch (cacheErr) {
        console.warn(`[NasaPowerService] Cache lookup error (continuing with fresh fetch): ${cacheErr.message}`);
      }
    }

    // 5. Fetch Upstream Data
    let rawData;
    try {
      rawData = await this.client.fetchDailyPointData({
        latitude: lat,
        longitude: lon,
        start,
        end,
        parameters: paramsList
      });
    } catch (upstreamErr) {
      return {
        success: false,
        statusCode: upstreamErr.statusCode || 502,
        integrationStatus: upstreamErr.integrationStatus || INTEGRATION_STATUS.UPSTREAM_ERROR,
        error: upstreamErr.message,
        details: upstreamErr.details || null
      };
    }

    // 6. Normalize Upstream Data
    let normalizedData;
    try {
      normalizedData = normalizeNasaPowerResponse(rawData, {
        latitude: lat,
        longitude: lon,
        start,
        end,
        parameters: paramsList
      });
    } catch (normErr) {
      return {
        success: false,
        statusCode: 502,
        integrationStatus: INTEGRATION_STATUS.UPSTREAM_ERROR,
        error: `Failed to normalize NASA POWER response: ${normErr.message}`
      };
    }

    // 7. Store in Cache (if DB connected and successful)
    let cached = false;
    let expiresAt = null;
    if (isDbConnected && normalizedData.status !== INTEGRATION_STATUS.NO_DATA_AVAILABLE) {
      try {
        expiresAt = new Date(Date.now() + this.cacheTtlMs);
        await ApiCache.findOneAndUpdate(
          { cacheKey },
          {
            $set: {
              source: 'NASA_POWER',
              parameters: {
                latitude: lat,
                longitude: lon,
                start,
                end,
                parameters: paramsList
              },
              responseData: normalizedData,
              fetchedAt: new Date(),
              expiresAt,
              status: 'VALID',
              metadata: {
                totalDays: normalizedData.summary?.totalDays,
                totalObservations: normalizedData.summary?.totalObservations
              }
            }
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        cached = true;
      } catch (saveCacheErr) {
        console.warn(`[NasaPowerService] Failed to cache NASA POWER response: ${saveCacheErr.message}`);
      }
    }

    // 8. Persist to EnvironmentalObservation if farmId is provided
    let persistenceStatus = 'NOT_APPLICABLE';
    if (farmId && isDbConnected) {
      persistenceStatus = await this.persistObservationsToFarm(farmId, normalizedData.flatObservations);
    } else if (farmId && !isDbConnected) {
      persistenceStatus = 'SKIPPED_DB_DISCONNECTED';
    }

    return {
      success: true,
      statusCode: 200,
      integrationStatus: normalizedData.status,
      source: 'NASA_POWER',
      cached,
      expiresAt,
      persistenceStatus,
      data: normalizedData
    };
  }

  /**
   * Retrieves NASA POWER observations for a specific Farm document
   * 
   * @param {object} params
   * @param {string} params.farmId
   * @param {string} params.startDate
   * @param {string} params.endDate
   * @param {string|string[]} [params.parameters]
   * @returns {Promise<object>}
   */
  async getFarmData({ farmId, startDate, endDate, parameters }) {
    // 1. Validate Farm ID format
    const idValidation = validateObjectId(farmId);
    if (!idValidation.isValid) {
      return {
        success: false,
        statusCode: 400,
        integrationStatus: INTEGRATION_STATUS.INVALID_COORDINATES,
        error: idValidation.error
      };
    }

    // 2. Database connectivity check
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected) {
      return {
        success: false,
        statusCode: 503,
        integrationStatus: INTEGRATION_STATUS.DATABASE_UNAVAILABLE,
        error: 'Database is currently disconnected. Cannot retrieve farm coordinates.'
      };
    }

    // 3. Farm lookup
    let farm;
    try {
      farm = await Farm.findById(farmId).lean();
    } catch (dbErr) {
      return {
        success: false,
        statusCode: 500,
        integrationStatus: INTEGRATION_STATUS.DATABASE_UNAVAILABLE,
        error: `Database query error: ${dbErr.message}`
      };
    }

    if (!farm) {
      return {
        success: false,
        statusCode: 404,
        integrationStatus: INTEGRATION_STATUS.INVALID_COORDINATES,
        error: `Farm with ID '${farmId}' was not found in the database.`
      };
    }

    const { latitude, longitude } = farm.coordinates || {};
    if (latitude === undefined || longitude === undefined) {
      return {
        success: false,
        statusCode: 400,
        integrationStatus: INTEGRATION_STATUS.INVALID_COORDINATES,
        error: `Farm '${farm.farmName || farmId}' does not have valid geographical coordinates configured.`
      };
    }

    // 4. Delegate to coordinate point fetcher with farmId attachment
    const result = await this.getPointData({
      latitude,
      longitude,
      startDate,
      endDate,
      parameters,
      farmId: farm._id.toString()
    });

    if (result.success && result.data) {
      result.farm = {
        id: farm._id.toString(),
        farmName: farm.farmName,
        district: farm.district,
        locationName: farm.locationName,
        coordinates: farm.coordinates
      };
    }

    return result;
  }

  /**
   * Persists normalized observations into the EnvironmentalObservation model
   * @param {string} farmId 
   * @param {Array<object>} flatObservations 
   * @returns {Promise<string>} Persistence status
   */
  async persistObservationsToFarm(farmId, flatObservations) {
    if (!flatObservations || flatObservations.length === 0) {
      return 'NO_OBSERVATIONS_TO_PERSIST';
    }

    try {
      const ops = flatObservations.map(obs => ({
        updateOne: {
          filter: {
            farm: farmId,
            parameter: obs.parameter,
            observationDate: obs.dateObj
          },
          update: {
            $set: {
              farm: farmId,
              parameter: obs.parameter,
              value: obs.value,
              unit: obs.unit,
              sourceName: obs.sourceName,
              sourceProduct: obs.sourceProduct,
              observationDate: obs.dateObj,
              retrievalDate: new Date(),
              spatialResolution: obs.spatialResolution,
              temporalResolution: obs.temporalResolution,
              qualityFlag: obs.qualityFlag,
              dataOrigin: obs.dataOrigin,
              metadata: {
                ...obs.metadata,
                rawParameter: obs.rawParameter
              }
            }
          },
          upsert: true
        }
      }));

      await EnvironmentalObservation.bulkWrite(ops, { ordered: false });
      return 'PERSISTED_SUCCESS';
    } catch (err) {
      console.warn(`[NasaPowerService] Failed to persist observations to database: ${err.message}`);
      return 'PERSISTENCE_FAILED';
    }
  }

  /**
   * Returns current provider status and verified capabilities
   */
  getProviderStatus() {
    return {
      provider: 'NASA POWER',
      portalUrl: NASA_POWER_CONFIG.PORTAL_URL,
      docsUrl: NASA_POWER_CONFIG.DOCS_URL,
      serviceEndpoint: NASA_POWER_CONFIG.BASE_URL,
      community: NASA_POWER_CONFIG.COMMUNITY,
      timeStandard: NASA_POWER_CONFIG.TIME_STANDARD,
      status: 'OPERATIONAL',
      defaultCacheTtlHours: NASA_POWER_CONFIG.CACHE_TTL_MS / (1000 * 60 * 60),
      supportedParameters: NASA_POWER_PARAMETERS,
      disclaimer: SCIENTIFIC_DISCLAIMER,
      limitations: [
        'Data are gridded model assimilation and satellite radiation estimates (MERRA-2: 0.5° × 0.625°, CERES/FLASHFlux/SRB: 1.0° × 1.0°).',
        'Observations are queried in explicit UTC time standard (time-standard=UTC).',
        'Not a substitute for direct on-farm ground sensor or laboratory soil analysis.',
        'Nominal observation latency is 2 to 3 days for standard meteorological daily streams.',
        'Documented fill values (-999) are mapped to null; missing observations are not interpolated.'
      ]
    };
  }
}

export const nasaPowerService = new NasaPowerService();
export default nasaPowerService;
