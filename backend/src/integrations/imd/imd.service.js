/**
 * India Meteorological Department (IMD) Service Layer
 * 
 * Orchestrates API communication, caching in ApiCache, normalization,
 * and persistence into EnvironmentalObservation models.
 * 
 * An independent submission for Seva First Innovation Challenge – Eastern Region | West Bengal, India
 */

import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import {
  IMD_CONFIG,
  IMD_STATUS,
  IMD_AVAILABILITY_STATES,
  SCIENTIFIC_DISCLAIMER,
  WEST_BENGAL_IMD_STATIONS
} from './imd.constants.js';
import {
  validateStationId,
  validateDistrict,
  validateObjectId
} from './imd.validators.js';
import {
  normalizeCurrentWeather,
  normalizeDistrictRainfall,
  normalizeStateRainfall,
  normalizeAwsData
} from './imd.normalizer.js';
import { imdClient, ImdUpstreamError } from './imd.client.js';
import { ApiCache } from '../../models/ApiCache.js';
import { Farm } from '../../models/Farm.js';
import { EnvironmentalObservation } from '../../models/EnvironmentalObservation.js';

/**
 * Generates a deterministic cache key for IMD requests
 * 
 * @param {string} endpoint
 * @param {object} params
 * @returns {string}
 */
export function generateImdCacheKey(endpoint, params = {}) {
  const cleanEndpoint = endpoint.replace(/^\//, '').replace(/\//g, '_');
  const sortedPairs = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k.toLowerCase()}=${String(v).trim().toLowerCase()}`);
  
  const queryString = sortedPairs.length > 0 ? `_${sortedPairs.join('&')}` : '';
  return `imd_${cleanEndpoint}${queryString}`;
}

export class ImdService {
  constructor(options = {}) {
    this.client = options.client || imdClient;
    this.cacheTtls = {
      currentWeather: options.currentWeatherTtl || IMD_CONFIG.CACHE_TTL.CURRENT_WX_MS,
      districtRainfall: options.districtRainfallTtl || IMD_CONFIG.CACHE_TTL.DISTRICT_RAINFALL_MS,
      stateRainfall: options.stateRainfallTtl || IMD_CONFIG.CACHE_TTL.STATE_RAINFALL_MS,
      awsData: options.awsDataTtl || IMD_CONFIG.CACHE_TTL.AWS_DATA_MS
    };
  }

  /**
   * Returns current provider integration and endpoint status
   * 
   * @returns {object}
   */
  getStatus() {
    const hasApiKey = Boolean(env.imd?.apiKey && env.imd.apiKey !== 'your_imd_api_key_here');
    const hasBearer = Boolean(env.imd?.bearerToken && env.imd.bearerToken !== 'your_imd_bearer_token_here');
    const hasCredentials = hasApiKey || hasBearer;

    let overallStatus = IMD_AVAILABILITY_STATES.AWAITING_CREDENTIALS;
    if (hasCredentials) {
      overallStatus = IMD_AVAILABILITY_STATES.AVAILABLE;
    }

    const endpointStatus = hasCredentials ? IMD_AVAILABILITY_STATES.AVAILABLE : IMD_AVAILABILITY_STATES.AWAITING_CREDENTIALS;

    return {
      success: true,
      provider: 'IMD',
      title: 'India Meteorological Department (IMD) Data Integration',
      status: overallStatus,
      credentialsConfigured: {
        apiKey: hasApiKey,
        bearerToken: hasBearer
      },
      endpoints: {
        current_wx: endpointStatus,
        districtrainfall: endpointStatus,
        staterainfall: endpointStatus,
        aws_data: endpointStatus
      },
      supportedStations: Object.keys(WEST_BENGAL_IMD_STATIONS).length,
      sampleStations: WEST_BENGAL_IMD_STATIONS,
      portalUrl: IMD_CONFIG.PORTAL_URL,
      docsUrl: IMD_CONFIG.DOCS_URL,
      disclaimer: SCIENTIFIC_DISCLAIMER,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Persists normalized observations into MongoDB EnvironmentalObservation collection.
   * Resilient to database disconnects; performs idempotent bulk upserts.
   * 
   * @param {string} farmId 
   * @param {Array} observations 
   * @returns {Promise<{ persisted: number, skipped: boolean }>}
   */
  async persistObservations(farmId, observations) {
    if (!farmId || !Array.isArray(observations) || observations.length === 0) {
      return { persisted: 0, skipped: true };
    }

    if (mongoose.connection.readyState !== 1) {
      return { persisted: 0, skipped: true, reason: 'DATABASE_DISCONNECTED' };
    }

    try {
      const farmObjId = new mongoose.Types.ObjectId(farmId);
      const bulkOps = observations.map(obs => ({
        updateOne: {
          filter: {
            farm: farmObjId,
            parameter: obs.parameter,
            observationDate: obs.dateObj
          },
          update: {
            $set: {
              value: obs.value,
              unit: obs.unit,
              sourceName: obs.sourceName || 'IMD',
              sourceProduct: obs.sourceProduct,
              spatialResolution: obs.spatialResolution,
              temporalResolution: obs.temporalResolution,
              qualityFlag: obs.qualityFlag,
              dataOrigin: 'OBSERVED',
              metadata: obs.metadata || {},
              retrievalDate: new Date()
            }
          },
          upsert: true
        }
      }));

      const result = await EnvironmentalObservation.bulkWrite(bulkOps, { ordered: false });
      const persisted = (result.upsertedCount || 0) + (result.modifiedCount || 0);
      return { persisted, skipped: false };
    } catch (err) {
      console.error('Failed to persist IMD observations to EnvironmentalObservation:', err.message);
      return { persisted: 0, skipped: true, error: err.message };
    }
  }

  /**
   * Retrieves Current Weather from IMD (/current_wx)
   * 
   * @param {object} params
   * @param {string} [params.stationId] Station WMO / IMD code (e.g. '42809')
   * @param {string} [params.district] District name
   * @param {string} [params.farmId] Associated farm ObjectId
   * @param {boolean} [params.forceRefresh] Force bypass cache
   * @returns {Promise<object>}
   */
  async getCurrentWeather({ stationId, district, farmId = null, forceRefresh = false } = {}) {
    // 1. Validation
    let validatedStationId = null;
    let validatedDistrict = null;

    if (stationId) {
      const stationValidation = validateStationId(stationId);
      if (!stationValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: stationValidation.statusCode,
          error: stationValidation.error
        };
      }
      validatedStationId = stationValidation.stationId;
    }

    if (district) {
      const districtValidation = validateDistrict(district);
      if (!districtValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: districtValidation.statusCode,
          error: districtValidation.error
        };
      }
      validatedDistrict = districtValidation.district;
    }

    if (farmId) {
      const farmValidation = validateObjectId(farmId, 'farmId');
      if (!farmValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: farmValidation.statusCode,
          error: farmValidation.error
        };
      }
    }

    const cacheKey = generateImdCacheKey(IMD_CONFIG.ENDPOINTS.CURRENT_WX, {
      stationId: validatedStationId,
      district: validatedDistrict
    });

    const isDbConnected = mongoose.connection.readyState === 1;

    // 2. Cache Lookup
    if (!forceRefresh && isDbConnected) {
      try {
        const cachedDoc = await ApiCache.findOne({
          source: 'IMD',
          cacheKey,
          expiresAt: { $gt: new Date() }
        });

        if (cachedDoc && cachedDoc.responsePayload) {
          return {
            success: true,
            fromCache: true,
            integrationStatus: IMD_STATUS.CACHE_HIT,
            cacheExpiresAt: cachedDoc.expiresAt,
            ...cachedDoc.responsePayload
          };
        }
      } catch (cacheErr) {
        console.warn('IMD ApiCache lookup failed, proceeding to upstream:', cacheErr.message);
      }
    }

    // 3. Upstream Fetch
    try {
      const rawResponse = await this.client.getCurrentWeather({
        stationId: validatedStationId,
        district: validatedDistrict
      });

      // 4. Normalization
      const normalized = normalizeCurrentWeather(rawResponse, {
        stationId: validatedStationId,
        district: validatedDistrict
      });

      // 5. Caching & Persistence
      if (isDbConnected) {
        try {
          const expiresAt = new Date(Date.now() + this.cacheTtls.currentWeather);
          await ApiCache.findOneAndUpdate(
            { source: 'IMD', cacheKey },
            {
              $set: {
                requestParams: {
                  endpoint: IMD_CONFIG.ENDPOINTS.CURRENT_WX,
                  stationId: validatedStationId,
                  district: validatedDistrict
                },
                responsePayload: normalized,
                expiresAt
              }
            },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (cacheWriteErr) {
          console.warn('IMD ApiCache write failed:', cacheWriteErr.message);
        }

        if (farmId) {
          await this.persistObservations(farmId, normalized.observations);
        }
      }

      return {
        success: true,
        fromCache: false,
        integrationStatus: normalized.status,
        ...normalized
      };
    } catch (err) {
      return this._handleUpstreamError(err, IMD_CONFIG.ENDPOINTS.CURRENT_WX);
    }
  }

  /**
   * Retrieves District Rainfall from IMD (/districtrainfall)
   * 
   * @param {object} params
   * @param {string} [params.district] District name
   * @param {string} [params.date] Date string
   * @param {string} [params.farmId] Associated farm ObjectId
   * @param {boolean} [params.forceRefresh] Force bypass cache
   * @returns {Promise<object>}
   */
  async getDistrictRainfall({ district, date, farmId = null, forceRefresh = false } = {}) {
    let validatedDistrict = null;
    if (district) {
      const districtValidation = validateDistrict(district);
      if (!districtValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: districtValidation.statusCode,
          error: districtValidation.error
        };
      }
      validatedDistrict = districtValidation.district;
    }

    if (farmId) {
      const farmValidation = validateObjectId(farmId, 'farmId');
      if (!farmValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: farmValidation.statusCode,
          error: farmValidation.error
        };
      }
    }

    const cacheKey = generateImdCacheKey(IMD_CONFIG.ENDPOINTS.DISTRICT_RAINFALL, {
      district: validatedDistrict,
      date
    });

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!forceRefresh && isDbConnected) {
      try {
        const cachedDoc = await ApiCache.findOne({
          source: 'IMD',
          cacheKey,
          expiresAt: { $gt: new Date() }
        });

        if (cachedDoc && cachedDoc.responsePayload) {
          return {
            success: true,
            fromCache: true,
            integrationStatus: IMD_STATUS.CACHE_HIT,
            cacheExpiresAt: cachedDoc.expiresAt,
            ...cachedDoc.responsePayload
          };
        }
      } catch (cacheErr) {
        console.warn('IMD ApiCache lookup failed, proceeding to upstream:', cacheErr.message);
      }
    }

    try {
      const rawResponse = await this.client.getDistrictRainfall({
        district: validatedDistrict,
        date
      });

      const normalized = normalizeDistrictRainfall(rawResponse, {
        district: validatedDistrict,
        date
      });

      if (isDbConnected) {
        try {
          const expiresAt = new Date(Date.now() + this.cacheTtls.districtRainfall);
          await ApiCache.findOneAndUpdate(
            { source: 'IMD', cacheKey },
            {
              $set: {
                requestParams: {
                  endpoint: IMD_CONFIG.ENDPOINTS.DISTRICT_RAINFALL,
                  district: validatedDistrict,
                  date
                },
                responsePayload: normalized,
                expiresAt
              }
            },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (cacheWriteErr) {
          console.warn('IMD ApiCache write failed:', cacheWriteErr.message);
        }

        if (farmId) {
          await this.persistObservations(farmId, normalized.observations);
        }
      }

      return {
        success: true,
        fromCache: false,
        integrationStatus: normalized.status,
        ...normalized
      };
    } catch (err) {
      return this._handleUpstreamError(err, IMD_CONFIG.ENDPOINTS.DISTRICT_RAINFALL);
    }
  }

  /**
   * Retrieves State Rainfall from IMD (/staterainfall)
   * 
   * @param {object} params
   * @param {string} [params.date] Date string
   * @param {string} [params.farmId] Associated farm ObjectId
   * @param {boolean} [params.forceRefresh] Force bypass cache
   * @returns {Promise<object>}
   */
  async getStateRainfall({ date, farmId = null, forceRefresh = false } = {}) {
    if (farmId) {
      const farmValidation = validateObjectId(farmId, 'farmId');
      if (!farmValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: farmValidation.statusCode,
          error: farmValidation.error
        };
      }
    }

    const cacheKey = generateImdCacheKey(IMD_CONFIG.ENDPOINTS.STATE_RAINFALL, { date });
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!forceRefresh && isDbConnected) {
      try {
        const cachedDoc = await ApiCache.findOne({
          source: 'IMD',
          cacheKey,
          expiresAt: { $gt: new Date() }
        });

        if (cachedDoc && cachedDoc.responsePayload) {
          return {
            success: true,
            fromCache: true,
            integrationStatus: IMD_STATUS.CACHE_HIT,
            cacheExpiresAt: cachedDoc.expiresAt,
            ...cachedDoc.responsePayload
          };
        }
      } catch (cacheErr) {
        console.warn('IMD ApiCache lookup failed, proceeding to upstream:', cacheErr.message);
      }
    }

    try {
      const rawResponse = await this.client.getStateRainfall({ date });
      const normalized = normalizeStateRainfall(rawResponse, { date });

      if (isDbConnected) {
        try {
          const expiresAt = new Date(Date.now() + this.cacheTtls.stateRainfall);
          await ApiCache.findOneAndUpdate(
            { source: 'IMD', cacheKey },
            {
              $set: {
                requestParams: {
                  endpoint: IMD_CONFIG.ENDPOINTS.STATE_RAINFALL,
                  date
                },
                responsePayload: normalized,
                expiresAt
              }
            },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (cacheWriteErr) {
          console.warn('IMD ApiCache write failed:', cacheWriteErr.message);
        }

        if (farmId) {
          await this.persistObservations(farmId, normalized.observations);
        }
      }

      return {
        success: true,
        fromCache: false,
        integrationStatus: normalized.status,
        ...normalized
      };
    } catch (err) {
      return this._handleUpstreamError(err, IMD_CONFIG.ENDPOINTS.STATE_RAINFALL);
    }
  }

  /**
   * Retrieves AWS/ARG Station Telemetry from IMD (/aws_data)
   * 
   * @param {object} params
   * @param {string} [params.stationId] Station ID
   * @param {string} [params.district] District name
   * @param {string} [params.farmId] Associated farm ObjectId
   * @param {boolean} [params.forceRefresh] Force bypass cache
   * @returns {Promise<object>}
   */
  async getAwsData({ stationId, district, farmId = null, forceRefresh = false } = {}) {
    let validatedStationId = null;
    let validatedDistrict = null;

    if (stationId) {
      const stationValidation = validateStationId(stationId);
      if (!stationValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: stationValidation.statusCode,
          error: stationValidation.error
        };
      }
      validatedStationId = stationValidation.stationId;
    }

    if (district) {
      const districtValidation = validateDistrict(district);
      if (!districtValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: districtValidation.statusCode,
          error: districtValidation.error
        };
      }
      validatedDistrict = districtValidation.district;
    }

    if (farmId) {
      const farmValidation = validateObjectId(farmId, 'farmId');
      if (!farmValidation.isValid) {
        return {
          success: false,
          statusCode: 400,
          integrationStatus: farmValidation.statusCode,
          error: farmValidation.error
        };
      }
    }

    const cacheKey = generateImdCacheKey(IMD_CONFIG.ENDPOINTS.AWS_DATA, {
      stationId: validatedStationId,
      district: validatedDistrict
    });

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!forceRefresh && isDbConnected) {
      try {
        const cachedDoc = await ApiCache.findOne({
          source: 'IMD',
          cacheKey,
          expiresAt: { $gt: new Date() }
        });

        if (cachedDoc && cachedDoc.responsePayload) {
          return {
            success: true,
            fromCache: true,
            integrationStatus: IMD_STATUS.CACHE_HIT,
            cacheExpiresAt: cachedDoc.expiresAt,
            ...cachedDoc.responsePayload
          };
        }
      } catch (cacheErr) {
        console.warn('IMD ApiCache lookup failed, proceeding to upstream:', cacheErr.message);
      }
    }

    try {
      const rawResponse = await this.client.getAwsData({
        stationId: validatedStationId,
        district: validatedDistrict
      });

      const normalized = normalizeAwsData(rawResponse, {
        stationId: validatedStationId,
        district: validatedDistrict
      });

      if (isDbConnected) {
        try {
          const expiresAt = new Date(Date.now() + this.cacheTtls.awsData);
          await ApiCache.findOneAndUpdate(
            { source: 'IMD', cacheKey },
            {
              $set: {
                requestParams: {
                  endpoint: IMD_CONFIG.ENDPOINTS.AWS_DATA,
                  stationId: validatedStationId,
                  district: validatedDistrict
                },
                responsePayload: normalized,
                expiresAt
              }
            },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (cacheWriteErr) {
          console.warn('IMD ApiCache write failed:', cacheWriteErr.message);
        }

        if (farmId) {
          await this.persistObservations(farmId, normalized.observations);
        }
      }

      return {
        success: true,
        fromCache: false,
        integrationStatus: normalized.status,
        ...normalized
      };
    } catch (err) {
      return this._handleUpstreamError(err, IMD_CONFIG.ENDPOINTS.AWS_DATA);
    }
  }

  /**
   * Translates upstream errors into standardized response objects
   * 
   * @private
   */
  _handleUpstreamError(err, endpoint) {
    if (err instanceof ImdUpstreamError) {
      return {
        success: false,
        statusCode: err.statusCode || 502,
        integrationStatus: err.integrationStatus || IMD_STATUS.UPSTREAM_ERROR,
        availabilityState: err.availabilityState || IMD_AVAILABILITY_STATES.ERROR,
        endpoint,
        error: err.message,
        details: err.details,
        disclaimer: SCIENTIFIC_DISCLAIMER
      };
    }

    console.error(`IMD unexpected error at ${endpoint}:`, err);
    return {
      success: false,
      statusCode: 500,
      integrationStatus: IMD_STATUS.UPSTREAM_ERROR,
      availabilityState: IMD_AVAILABILITY_STATES.ERROR,
      endpoint,
      error: err.message || 'Internal error processing IMD request',
      disclaimer: SCIENTIFIC_DISCLAIMER
    };
  }
}

export const imdService = new ImdService();
export default imdService;
