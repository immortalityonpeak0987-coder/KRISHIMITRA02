/**
 * NASA Satellite Data Service Layer
 * 
 * Coordinates CMR catalog search, AppEEARS async task execution,
 * caching in ApiCache, and persistence into SatelliteDataAsset & EnvironmentalObservation.
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import mongoose from 'mongoose';
import { config } from '../../config/env.js';
import {
  SATELLITE_CONFIG,
  SATELLITE_STATUS,
  NASA_SATELLITE_PRODUCTS,
  SCIENTIFIC_DISCLAIMER,
  calculateSpatialFootprint
} from './satelliteConfig.js';
import { cmrClient, CmrUpstreamError } from './cmrClient.js';
import { appeearsClient, AppeearsUpstreamError } from './appeearsClient.js';
import { modisClient } from './modisClient.js';
import { smapClient } from './smapClient.js';
import { gpmClient } from './gpmClient.js';
import {
  normalizeModisNdvi,
  normalizeSmapSoilMoisture,
  normalizeGpmImerg,
  parseDate
} from './satelliteNormalizer.js';
import { ApiCache } from '../../models/ApiCache.js';
import { Farm } from '../../models/Farm.js';
import { SatelliteDataAsset } from '../../models/SatelliteDataAsset.js';
import { EnvironmentalObservation } from '../../models/EnvironmentalObservation.js';

export function generateSatelliteCacheKey(category, params = {}) {
  const sortedPairs = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k.toLowerCase()}=${String(v).trim().toLowerCase()}`);

  const queryString = sortedPairs.length > 0 ? `_${sortedPairs.join('&')}` : '';
  return `sat_${category.toLowerCase()}${queryString}`;
}

export class SatelliteService {
  constructor(options = {}) {
    this.cmr = options.cmrClient || cmrClient;
    this.appeears = options.appeearsClient || appeearsClient;
    this.cacheTtlMs = options.cacheTtlMs || SATELLITE_CONFIG.CACHE_TTL_MS;
  }

  /**
   * Returns current operational status across all NASA satellite integrations
   */
  getStatus() {
    const hasEarthdata = this.appeears.hasCredentials();

    return {
      success: true,
      provider: 'NASA_SATELLITE_INTEGRATION',
      title: 'KRISHI-MITRA Satellite Data Integration',
      status: 'OPERATIONAL',
      credentialsConfigured: {
        earthdataLogin: hasEarthdata,
        usernameConfigured: Boolean(config.satellite?.earthdataUsername),
        tokenConfigured: Boolean(config.satellite?.earthdataToken)
      },
      services: {
        cmr: {
          name: 'NASA Common Metadata Repository (CMR)',
          status: 'AVAILABLE',
          url: SATELLITE_CONFIG.CMR_BASE_URL,
          requiresAuth: false,
          capability: 'Real-time collection & granule catalog search'
        },
        appeears: {
          name: 'NASA AppEEARS Processing Engine',
          status: hasEarthdata ? 'AVAILABLE' : 'AWAITING_CREDENTIALS',
          url: SATELLITE_CONFIG.APPEEARS_BASE_URL,
          requiresAuth: true,
          capability: 'Asynchronous point and polygon raster extraction'
        },
        modis: {
          name: 'MODIS Vegetation Indices (NDVI)',
          product: NASA_SATELLITE_PRODUCTS.MODIS_NDVI.fullIdentifier,
          resolution: '250m, 16-day',
          status: 'AVAILABLE'
        },
        smap: {
          name: 'SMAP Soil Moisture (L3 & L4)',
          productL3: NASA_SATELLITE_PRODUCTS.SMAP_SOIL_MOISTURE_L3.fullIdentifier,
          productL4: NASA_SATELLITE_PRODUCTS.SMAP_SOIL_MOISTURE_L4.fullIdentifier,
          resolution: '9km, daily / 3-hourly',
          status: 'AVAILABLE'
        },
        gpm: {
          name: 'GPM IMERG Precipitation (Late & Final)',
          productLate: NASA_SATELLITE_PRODUCTS.GPM_IMERG_LATE.fullIdentifier,
          productFinal: NASA_SATELLITE_PRODUCTS.GPM_IMERG_FINAL.fullIdentifier,
          resolution: '0.1° (~10km), daily',
          status: 'AVAILABLE'
        },
        hls: {
          name: 'Harmonized Landsat and Sentinel-2 (HLS)',
          product: NASA_SATELLITE_PRODUCTS.HLS_LANDSAT.fullIdentifier,
          resolution: '30m, 2-3 day revisit',
          status: 'AVAILABLE'
        }
      },
      supportedProductsCount: Object.keys(NASA_SATELLITE_PRODUCTS).length,
      disclaimer: SCIENTIFIC_DISCLAIMER,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Returns verified product specifications catalog
   */
  getProducts() {
    return {
      success: true,
      total: Object.keys(NASA_SATELLITE_PRODUCTS).length,
      products: NASA_SATELLITE_PRODUCTS,
      disclaimer: SCIENTIFIC_DISCLAIMER
    };
  }

  /**
   * Searches NASA CMR for collections or granules
   */
  async searchCmr({ type = 'collections', keyword, shortName, version, boundingBox, point, temporal, pageSize = 10, forceRefresh = false } = {}) {
    const isDbConnected = mongoose.connection.readyState === 1;
    const cacheKey = generateSatelliteCacheKey(`cmr_${type}`, {
      keyword,
      shortName,
      version,
      boundingBox,
      point,
      temporal,
      pageSize
    });

    if (!forceRefresh && isDbConnected) {
      try {
        const cachedDoc = await ApiCache.findOne({
          source: 'NASA_CMR',
          cacheKey,
          expiresAt: { $gt: new Date() }
        });

        if (cachedDoc && cachedDoc.responseData) {
          return {
            success: true,
            fromCache: true,
            integrationStatus: SATELLITE_STATUS.CACHE_HIT,
            ...cachedDoc.responseData
          };
        }
      } catch (err) {
        console.warn('CMR ApiCache lookup failed, querying upstream:', err.message);
      }
    }

    try {
      let result;
      if (type === 'granules') {
        result = await this.cmr.searchGranules({ shortName, version, boundingBox, point, temporal, pageSize });
      } else {
        result = await this.cmr.searchCollections({ keyword, shortName, version, boundingBox, pageSize });
      }

      if (isDbConnected) {
        try {
          const expiresAt = new Date(Date.now() + this.cacheTtlMs);
          await ApiCache.findOneAndUpdate(
            { source: 'NASA_CMR', cacheKey },
            {
              $set: {
                parameters: { type, keyword, shortName, version, boundingBox, point, temporal },
                responseData: result,
                expiresAt
              }
            },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (cacheErr) {
          console.warn('CMR ApiCache write failed:', cacheErr.message);
        }
      }

      return {
        success: true,
        fromCache: false,
        integrationStatus: SATELLITE_STATUS.SUCCESS,
        ...result
      };
    } catch (err) {
      return this._handleError(err, 'CMR');
    }
  }

  /**
   * Submits an asynchronous task to NASA AppEEARS
   */
  async submitAppeearsTask({ taskType = 'point', taskName, params, farmId = null } = {}) {
    if (!this.appeears.hasCredentials()) {
      return {
        success: false,
        statusCode: 401,
        integrationStatus: SATELLITE_STATUS.AWAITING_CREDENTIALS,
        error: 'NASA Earthdata credentials are required for AppEEARS task submission.',
        disclaimer: SCIENTIFIC_DISCLAIMER
      };
    }

    try {
      const taskResult = await this.appeears.submitTask({ taskType, taskName, params });
      const isDbConnected = mongoose.connection.readyState === 1;

      if (isDbConnected) {
        try {
          let farmRef = null;
          if (farmId && mongoose.Types.ObjectId.isValid(farmId)) {
            farmRef = new mongoose.Types.ObjectId(farmId);
          }

          const primaryLayer = params.layers?.[0] || {};
          const dates = params.dates?.[0] || {};

          await SatelliteDataAsset.create({
            farm: farmRef,
            dataset: primaryLayer.product?.split('.')[0] || 'CUSTOM',
            productId: primaryLayer.product?.split('.')[0] || 'CUSTOM',
            productVersion: primaryLayer.product?.split('.')[1] || '001',
            parameter: 'NDVI',
            layer: primaryLayer.layer || 'unspecified',
            taskId: taskResult.taskId,
            status: 'PENDING',
            observationPeriod: {
              startDate: dates.startDate ? new Date(dates.startDate) : new Date(),
              endDate: dates.endDate ? new Date(dates.endDate) : new Date()
            },
            dataOrigin: 'SATELLITE_DERIVED',
            metadata: { taskName, taskType, params }
          });
        } catch (dbErr) {
          console.warn('Failed to save SatelliteDataAsset on task submission:', dbErr.message);
        }
      }

      return {
        success: true,
        integrationStatus: SATELLITE_STATUS.TASK_SUBMITTED,
        ...taskResult
      };
    } catch (err) {
      return this._handleError(err, 'AppEEARS');
    }
  }

  /**
   * Checks AppEEARS processing status for a submitted task
   */
  async getAppeearsTaskStatus(taskId) {
    try {
      const statusResult = await this.appeears.getTaskStatus(taskId);
      const isDbConnected = mongoose.connection.readyState === 1;

      if (isDbConnected) {
        try {
          const upperStatus = statusResult.status.toUpperCase();
          const mappedStatus = ['PENDING', 'PROCESSING', 'DONE', 'COMPLETED', 'ERROR', 'FAILED'].includes(upperStatus)
            ? (upperStatus === 'DONE' ? 'COMPLETED' : (upperStatus === 'ERROR' ? 'FAILED' : upperStatus))
            : 'PROCESSING';

          await SatelliteDataAsset.findOneAndUpdate(
            { taskId },
            { $set: { status: mappedStatus, 'metadata.lastStatusCheck': new Date() } }
          );
        } catch (dbErr) {
          console.warn('Failed to update SatelliteDataAsset status:', dbErr.message);
        }
      }

      return {
        success: true,
        integrationStatus: statusResult.status === 'done' ? SATELLITE_STATUS.TASK_COMPLETED : SATELLITE_STATUS.TASK_PROCESSING,
        ...statusResult
      };
    } catch (err) {
      return this._handleError(err, 'AppEEARS');
    }
  }

  /**
   * Retrieves output bundle file references for a completed task
   */
  async getAppeearsTaskData(taskId) {
    try {
      const bundleResult = await this.appeears.getBundle(taskId);
      const isDbConnected = mongoose.connection.readyState === 1;

      if (isDbConnected) {
        try {
          await SatelliteDataAsset.findOneAndUpdate(
            { taskId },
            {
              $set: {
                status: 'COMPLETED',
                outputFiles: bundleResult.files.map(f => ({
                  fileId: f.fileId,
                  fileName: f.fileName,
                  fileSize: f.fileSize,
                  fileType: f.fileType,
                  sha256: f.sha256,
                  storageReference: `appeears://bundle/${taskId}/${f.fileId}`
                }))
              }
            }
          );
        } catch (dbErr) {
          console.warn('Failed to update SatelliteDataAsset outputFiles:', dbErr.message);
        }
      }

      return {
        success: true,
        integrationStatus: SATELLITE_STATUS.TASK_COMPLETED,
        ...bundleResult,
        disclaimer: SCIENTIFIC_DISCLAIMER
      };
    } catch (err) {
      return this._handleError(err, 'AppEEARS');
    }
  }

  /**
   * Translates upstream errors into standard response structures
   * @private
   */
  _handleError(err, serviceName) {
    if (err instanceof CmrUpstreamError || err instanceof AppeearsUpstreamError) {
      return {
        success: false,
        statusCode: err.statusCode || 502,
        integrationStatus: err.integrationStatus || SATELLITE_STATUS.UPSTREAM_ERROR,
        service: serviceName,
        error: err.message,
        details: err.details,
        disclaimer: SCIENTIFIC_DISCLAIMER
      };
    }

    console.error(`${serviceName} unexpected error:`, err);
    return {
      success: false,
      statusCode: 500,
      integrationStatus: SATELLITE_STATUS.UPSTREAM_ERROR,
      service: serviceName,
      error: err.message || 'Internal error processing satellite request',
      disclaimer: SCIENTIFIC_DISCLAIMER
    };
  }
}

export const satelliteService = new SatelliteService();
export default satelliteService;
