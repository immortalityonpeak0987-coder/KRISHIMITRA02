/**
 * Google Earth Engine REST API HTTP Client
 * 
 * Implements discovery document extraction, project configuration validation,
 * service account authentication verification, and SSRF-protected REST calls.
 * 
 * References:
 * - Discovery URL: https://earthengine.googleapis.com/$discovery/rest?version=v1
 * - Reference: https://developers.google.com/earth-engine/reference/rest
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import axios from 'axios';
import { config } from '../../config/env.js';
import {
  EARTH_ENGINE_CONFIG,
  EARTH_ENGINE_STATUS,
  REQUIRED_CREDENTIALS_SPEC,
  SCIENTIFIC_DISCLAIMER
} from './earthEngine.constants.js';

export class EarthEngineUpstreamError extends Error {
  constructor(message, { statusCode = 502, statusText = 'Bad Gateway', integrationStatus = EARTH_ENGINE_STATUS.UPSTREAM_ERROR, details = null } = {}) {
    super(message);
    this.name = 'EarthEngineUpstreamError';
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.integrationStatus = integrationStatus;
    this.details = details;
  }
}

export class EarthEngineClient {
  constructor(options = {}) {
    this.discoveryUrl = options.discoveryUrl || config.earthEngine?.discoveryUrl || EARTH_ENGINE_CONFIG.DISCOVERY_URL;
    this.baseUrl = options.baseUrl || config.earthEngine?.baseUrl || EARTH_ENGINE_CONFIG.BASE_URL;
    this.projectId = options.projectId !== undefined ? options.projectId : (config.earthEngine?.projectId || '');
    this.keyFilePath = options.keyFilePath !== undefined ? options.keyFilePath : (config.earthEngine?.keyFilePath || '');
    this.timeout = options.timeout || config.earthEngine?.timeoutMs || EARTH_ENGINE_CONFIG.DEFAULT_TIMEOUT_MS;
    this.httpClient = options.httpClient || null;
  }

  /**
   * Validates whether a valid Google Cloud project ID is configured
   * @returns {boolean}
   */
  hasProjectConfiguration() {
    return Boolean(
      this.projectId &&
      this.projectId.trim() !== '' &&
      this.projectId !== 'your_gcp_project_id' &&
      !this.projectId.includes('<')
    );
  }

  /**
   * Validates whether Google Cloud credentials are configured
   * @returns {boolean}
   */
  hasCredentials() {
    return Boolean(
      this.keyFilePath &&
      this.keyFilePath.trim() !== '' &&
      this.keyFilePath !== '/path/to/service-account-key.json' &&
      !this.keyFilePath.includes('<')
    );
  }

  /**
   * Evaluates project authentication and configuration readiness
   * @returns {{ configured: boolean, status: string, message: string }}
   */
  getAuthStatus() {
    if (!this.hasProjectConfiguration()) {
      return {
        configured: false,
        status: EARTH_ENGINE_STATUS.PROJECT_CONFIGURATION_REQUIRED,
        message: 'Google Cloud Project ID is not configured in GOOGLE_CLOUD_PROJECT_ID environment variable.',
        requiredSpec: REQUIRED_CREDENTIALS_SPEC
      };
    }

    if (!this.hasCredentials()) {
      return {
        configured: false,
        status: EARTH_ENGINE_STATUS.AUTH_REQUIRED,
        message: 'Google Cloud Service Account credentials are not configured in GOOGLE_APPLICATION_CREDENTIALS.',
        requiredSpec: REQUIRED_CREDENTIALS_SPEC
      };
    }

    return {
      configured: true,
      status: EARTH_ENGINE_STATUS.AVAILABLE,
      message: 'Google Cloud project and service credentials are configured.',
      projectId: this.projectId
    };
  }

  /**
   * Fetches the official Google Earth Engine API v1 Discovery Document.
   * Publicly accessible, requires NO authentication credentials.
   * 
   * @returns {Promise<object>} Parsed discovery schema
   */
  async fetchDiscoveryDocument() {
    // SSRF protection: restrict discovery requests to official googleapis.com domains or test hosts
    const allowed = [
      'https://earthengine.googleapis.com',
      'http://localhost',
      'http://127.0.0.1'
    ];
    const isAllowed = allowed.some(p => this.discoveryUrl.startsWith(p));
    if (!isAllowed) {
      throw new EarthEngineUpstreamError(
        `SSRF protection: Disallowed discovery URL '${this.discoveryUrl}'. Requests must target official Google Earth Engine endpoints.`,
        {
          statusCode: 400,
          integrationStatus: EARTH_ENGINE_STATUS.INVALID_PARAMETERS
        }
      );
    }

    const client = this.httpClient || axios.create({
      timeout: this.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KRISHI-MITRA/1.0.0'
      }
    });

    try {
      const response = await client.get(this.discoveryUrl);

      if (!response.data || typeof response.data !== 'object') {
        throw new EarthEngineUpstreamError(
          'Google Earth Engine returned an empty or invalid discovery response.',
          {
            statusCode: 502,
            integrationStatus: EARTH_ENGINE_STATUS.UPSTREAM_ERROR
          }
        );
      }

      return response.data;
    } catch (err) {
      if (err instanceof EarthEngineUpstreamError) throw err;

      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        throw new EarthEngineUpstreamError(
          `Google Earth Engine discovery request timed out after ${this.timeout}ms.`,
          {
            statusCode: 504,
            statusText: 'Gateway Timeout',
            integrationStatus: EARTH_ENGINE_STATUS.UPSTREAM_TIMEOUT
          }
        );
      }

      if (err.response) {
        const status = err.response.status;
        throw new EarthEngineUpstreamError(
          `Google Earth Engine discovery endpoint rejected with status ${status}: ${JSON.stringify(err.response.data || 'Upstream Error')}`,
          {
            statusCode: status >= 500 ? 503 : 502,
            integrationStatus: status >= 500 ? EARTH_ENGINE_STATUS.UPSTREAM_UNAVAILABLE : EARTH_ENGINE_STATUS.UPSTREAM_ERROR,
            details: { upstreamStatus: status }
          }
        );
      }

      throw new EarthEngineUpstreamError(
        `Failed to connect to Google Earth Engine discovery service: ${err.message}`,
        {
          statusCode: 503,
          integrationStatus: EARTH_ENGINE_STATUS.UPSTREAM_UNAVAILABLE
        }
      );
    }
  }

  /**
   * Queries project-level assets when project configuration is valid
   * 
   * @param {object} params
   * @param {string} [params.parent]
   * @param {number} [params.pageSize=20]
   * @returns {Promise<object>}
   */
  async listProjectAssets({ parent, pageSize = 20 } = {}) {
    const authStatus = this.getAuthStatus();
    if (!authStatus.configured) {
      throw new EarthEngineUpstreamError(
        `Cannot execute Earth Engine computation: ${authStatus.message}`,
        {
          statusCode: authStatus.status === EARTH_ENGINE_STATUS.PROJECT_CONFIGURATION_REQUIRED ? 412 : 401,
          integrationStatus: authStatus.status,
          details: { requiredSpec: REQUIRED_CREDENTIALS_SPEC }
        }
      );
    }

    const client = this.httpClient || axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KRISHI-MITRA/1.0.0'
      }
    });

    try {
      const targetParent = parent || `projects/${this.projectId}/assets`;
      const response = await client.get(`/projects/${this.projectId}/assets`, {
        params: { parent: targetParent, pageSize }
      });
      return response.data;
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        throw new EarthEngineUpstreamError(
          `Earth Engine asset request failed with status ${status}`,
          {
            statusCode: status,
            integrationStatus: status === 401 || status === 403 ? EARTH_ENGINE_STATUS.AUTH_REQUIRED : EARTH_ENGINE_STATUS.UPSTREAM_ERROR,
            details: err.response.data
          }
        );
      }
      throw new EarthEngineUpstreamError(
        `Failed to reach Earth Engine assets endpoint: ${err.message}`,
        {
          statusCode: 503,
          integrationStatus: EARTH_ENGINE_STATUS.UPSTREAM_UNAVAILABLE
        }
      );
    }
  }
}

export const earthEngineClient = new EarthEngineClient();
export default earthEngineClient;
