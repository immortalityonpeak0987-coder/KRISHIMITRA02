/**
 * Google Earth Engine Integration Service
 * 
 * Orchestrates Earth Engine discovery parsing, MongoDB ApiCache caching,
 * configuration verification, and scientific metadata delivery.
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import mongoose from 'mongoose';
import { ApiCache } from '../../models/ApiCache.js';
import { earthEngineClient } from './earthEngine.client.js';
import {
  EARTH_ENGINE_CONFIG,
  EARTH_ENGINE_STATUS,
  REQUIRED_CREDENTIALS_SPEC,
  SCIENTIFIC_DISCLAIMER
} from './earthEngine.constants.js';

export class EarthEngineService {
  constructor(client = earthEngineClient) {
    this.client = client;
  }

  /**
   * Retrieves operational provider status, capability, and credential verification
   * @returns {object} Status metadata
   */
  getStatus() {
    const authStatus = this.client.getAuthStatus();

    let displayStatus = authStatus.status;
    if (authStatus.configured) {
      displayStatus = EARTH_ENGINE_STATUS.AVAILABLE;
    }

    return {
      provider: 'Google Earth Engine',
      serviceType: 'GEOSPATIAL_ANALYSIS_API',
      status: displayStatus,
      isConfigured: authStatus.configured,
      discoveryUrl: this.client.discoveryUrl,
      baseUrl: this.client.baseUrl,
      projectId: this.client.hasProjectConfiguration() ? this.client.projectId : null,
      credentialsConfigured: this.client.hasCredentials(),
      message: authStatus.message,
      capabilities: {
        discoveryDocumentAccess: true,
        restApiVersion: 'v1',
        supportsVegetationCondition: true,
        supportsTimeAggregate: true,
        supportsMultiBandRaster: true,
        supportedFormFactors: ['Point', 'Polygon', 'BoundingBox']
      },
      pilotGeographyCoverage: {
        primaryDistricts: ['Purba Bardhaman', 'Hooghly', 'South 24 Parganas (Gosaba)'],
        stateWideCoverage: 'West Bengal (All 23 Districts Supported)'
      },
      disclaimer: SCIENTIFIC_DISCLAIMER,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retrieves technical configuration requirements, scopes, and setup guidelines
   * @returns {object} Configuration specs
   */
  getConfig() {
    const authStatus = this.client.getAuthStatus();

    return {
      provider: 'Google Earth Engine',
      discoveryUrl: this.client.discoveryUrl,
      baseUrl: this.client.baseUrl,
      currentConfiguration: {
        projectIdConfigured: this.client.hasProjectConfiguration(),
        credentialsConfigured: this.client.hasCredentials(),
        configuredStatus: authStatus.status
      },
      requiredCredentialsSpec: REQUIRED_CREDENTIALS_SPEC,
      setupInstructions: [
        '1. Create or select a Google Cloud Project with billing enabled.',
        '2. Enable the Earth Engine API: https://console.cloud.google.com/apis/library/earthengine.googleapis.com',
        '3. Create a Service Account and grant roles/earthengine.reader or roles/earthengine.writer.',
        '4. Download the Service Account JSON key and set GOOGLE_APPLICATION_CREDENTIALS in backend .env.',
        '5. Set GOOGLE_CLOUD_PROJECT_ID=<your-project-id> in backend .env.'
      ],
      disclaimer: SCIENTIFIC_DISCLAIMER
    };
  }

  /**
   * Retrieves and caches the Google Earth Engine API v1 discovery schema
   * 
   * @param {object} options
   * @param {boolean} [options.forceRefresh=false]
   * @returns {Promise<object>} Discovery schema summary
   */
  async getDiscovery({ forceRefresh = false } = {}) {
    const cacheKey = 'gee_discovery_rest_v1';
    const isDbConnected = mongoose.connection.readyState === 1;

    // 1. Check MongoDB ApiCache if connected and refresh not forced
    if (isDbConnected && !forceRefresh) {
      try {
        const cached = await ApiCache.findOne({
          cacheKey,
          source: 'GOOGLE_EARTH_ENGINE',
          status: 'VALID',
          expiresAt: { $gt: new Date() }
        });

        if (cached && cached.responseData) {
          return {
            success: true,
            fromCache: true,
            data: cached.responseData,
            integrationStatus: EARTH_ENGINE_STATUS.CACHE_HIT,
            disclaimer: SCIENTIFIC_DISCLAIMER
          };
        }
      } catch (err) {
        // Cache read failure: gracefully proceed to upstream fetch
      }
    }

    // 2. Fetch Discovery Document from upstream
    try {
      const rawDiscovery = await this.client.fetchDiscoveryDocument();

      const summary = {
        id: rawDiscovery.id || 'earthengine:v1',
        title: rawDiscovery.title || 'Google Earth Engine API',
        version: rawDiscovery.version || 'v1',
        name: rawDiscovery.name || 'earthengine',
        description: rawDiscovery.description || 'Provides access to Earth Engine geospatial processing.',
        discoveryVersion: rawDiscovery.discoveryVersion || 'v1',
        baseUrl: rawDiscovery.baseUrl || this.client.baseUrl,
        rootUrl: rawDiscovery.rootUrl || 'https://earthengine.googleapis.com/',
        authScopes: Object.keys(rawDiscovery.auth?.oauth2?.scopes || {}),
        resources: Object.keys(rawDiscovery.resources || {}),
        methodsCount: Object.keys(rawDiscovery.methods || {}).length,
        schemasCount: Object.keys(rawDiscovery.schemas || {}).length,
        parameters: Object.keys(rawDiscovery.parameters || {})
      };

      // 3. Persist in ApiCache if DB connected
      if (isDbConnected) {
        try {
          const expiresAt = new Date(Date.now() + EARTH_ENGINE_CONFIG.CACHE_TTL_MS);
          await ApiCache.findOneAndUpdate(
            { cacheKey },
            {
              cacheKey,
              source: 'GOOGLE_EARTH_ENGINE',
              parameters: { version: 'v1' },
              responseData: summary,
              fetchedAt: new Date(),
              expiresAt,
              status: 'VALID',
              metadata: { title: summary.title, version: summary.version }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (err) {
          // Cache write failure: non-blocking
        }
      }

      return {
        success: true,
        fromCache: false,
        data: summary,
        integrationStatus: EARTH_ENGINE_STATUS.SUCCESS,
        disclaimer: SCIENTIFIC_DISCLAIMER
      };
    } catch (err) {
      return {
        success: false,
        statusCode: err.statusCode || 502,
        error: err.message,
        integrationStatus: err.integrationStatus || EARTH_ENGINE_STATUS.UPSTREAM_ERROR,
        details: err.details || null
      };
    }
  }
}

export const earthEngineService = new EarthEngineService();
export default earthEngineService;
