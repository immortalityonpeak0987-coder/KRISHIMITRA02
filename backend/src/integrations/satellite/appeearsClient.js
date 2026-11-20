/**
 * NASA AppEEARS Client (Application for Extracting and Exploring Analysis Ready Samples)
 * 
 * Asynchronous satellite processing and data subsetting engine.
 * Endpoint: https://appeears.earthdatacloud.nasa.gov/api
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import axios from 'axios';
import { config } from '../../config/env.js';
import { SATELLITE_CONFIG, SATELLITE_STATUS, NASA_SATELLITE_PRODUCTS } from './satelliteConfig.js';

export class AppeearsUpstreamError extends Error {
  constructor(message, { statusCode = 502, integrationStatus = SATELLITE_STATUS.UPSTREAM_ERROR, details = null } = {}) {
    super(message);
    this.name = 'AppeearsUpstreamError';
    this.statusCode = statusCode;
    this.integrationStatus = integrationStatus;
    this.details = details;
  }
}

export class AppeearsClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || config.satellite?.appeearsBaseUrl || SATELLITE_CONFIG.APPEEARS_BASE_URL;
    this.username = options.username !== undefined ? options.username : (config.satellite?.earthdataUsername || '');
    this.password = options.password !== undefined ? options.password : (config.satellite?.earthdataPassword || '');
    this.bearerToken = options.bearerToken !== undefined ? options.bearerToken : (config.satellite?.earthdataToken || '');
    this.timeout = options.timeout || config.satellite?.timeoutMs || SATELLITE_CONFIG.DEFAULT_TIMEOUT_MS;
    this.httpClient = options.httpClient || null;

    this.token = this.bearerToken || null;
    this.tokenExpiresAt = null;
  }

  hasCredentials() {
    return Boolean(
      (this.username && this.username.trim() !== '' && this.username !== 'your_earthdata_username' &&
       this.password && this.password.trim() !== '' && this.password !== 'your_earthdata_password') ||
      (this.bearerToken && this.bearerToken.trim() !== '' && this.bearerToken !== 'your_earthdata_bearer_token_optional')
    );
  }

  async login() {
    if (this.token && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.token;
    }

    if (!this.hasCredentials()) {
      throw new AppeearsUpstreamError(
        'NASA Earthdata Login credentials (username/password or token) are not configured.',
        {
          statusCode: 401,
          integrationStatus: SATELLITE_STATUS.AWAITING_CREDENTIALS,
          details: { missingCredentials: ['EARTHDATA_USERNAME', 'EARTHDATA_PASSWORD'] }
        }
      );
    }

    if (this.bearerToken && this.bearerToken.trim() !== '' && this.bearerToken !== 'your_earthdata_bearer_token_optional') {
      this.token = this.bearerToken.trim();
      this.tokenExpiresAt = new Date(Date.now() + 48 * 3600 * 1000);
      return this.token;
    }

    const client = this.httpClient || axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout
    });

    try {
      const authHeader = 'Basic ' + Buffer.from(`${this.username.trim()}:${this.password.trim()}`).toString('base64');
      const url = this.httpClient ? `${this.baseUrl}/login` : '/login';
      const response = await client.post(url, {}, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.data || !response.data.token) {
        throw new AppeearsUpstreamError('AppEEARS login did not return a valid session token.', {
          statusCode: 401,
          integrationStatus: SATELLITE_STATUS.AWAITING_CREDENTIALS
        });
      }

      this.token = response.data.token;
      this.tokenExpiresAt = response.data.expiration ? new Date(response.data.expiration) : new Date(Date.now() + 48 * 3600 * 1000);
      return this.token;
    } catch (err) {
      if (err instanceof AppeearsUpstreamError) throw err;
      throw new AppeearsUpstreamError(`NASA Earthdata authentication failed: ${err.message}`, {
        statusCode: 401,
        integrationStatus: SATELLITE_STATUS.AWAITING_CREDENTIALS,
        details: { error: err.response?.data || err.message }
      });
    }
  }

  async _request(method, endpoint, { data = null, params = null } = {}) {
    const allowed = ['https://appeears.earthdatacloud.nasa.gov', 'http://localhost', 'http://127.0.0.1'];
    if (!allowed.some(p => this.baseUrl.startsWith(p))) {
      throw new AppeearsUpstreamError(`SSRF protection: Disallowed upstream URL '${this.baseUrl}'.`, {
        statusCode: 400,
        integrationStatus: SATELLITE_STATUS.INVALID_PARAMETERS
      });
    }

    // Must be authenticated to query AppEEARS
    const token = await this.login();

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'KRISHI-MITRA/1.0.0'
    };

    const client = this.httpClient || axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers
    });

    try {
      const url = this.httpClient ? `${this.baseUrl}${endpoint}` : endpoint;
      const response = await client({
        method,
        url,
        data,
        params,
        headers
      });

      return response.data;
    } catch (err) {
      if (err instanceof AppeearsUpstreamError) throw err;

      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        throw new AppeearsUpstreamError(`AppEEARS request timed out after ${this.timeout}ms.`, {
          statusCode: 504,
          integrationStatus: SATELLITE_STATUS.UPSTREAM_TIMEOUT
        });
      }

      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          this.token = null; // Invalidate cached token
          throw new AppeearsUpstreamError('AppEEARS token expired or invalid (401).', {
            statusCode: 401,
            integrationStatus: SATELLITE_STATUS.AWAITING_CREDENTIALS
          });
        }

        if (status >= 500) {
          throw new AppeearsUpstreamError(`AppEEARS service unavailable (${status}).`, {
            statusCode: 503,
            integrationStatus: SATELLITE_STATUS.UPSTREAM_UNAVAILABLE
          });
        }

        throw new AppeearsUpstreamError(`AppEEARS error (${status}): ${JSON.stringify(err.response.data || 'Client Error')}`, {
          statusCode: status === 400 ? 400 : 502,
          integrationStatus: status === 400 ? SATELLITE_STATUS.INVALID_PARAMETERS : SATELLITE_STATUS.UPSTREAM_ERROR,
          details: { error: err.response.data }
        });
      }

      throw new AppeearsUpstreamError(`Failed to connect to AppEEARS: ${err.message}`, {
        statusCode: 503,
        integrationStatus: SATELLITE_STATUS.UPSTREAM_UNAVAILABLE
      });
    }
  }

  /**
   * Submits an asynchronous extraction task to AppEEARS
   * 
   * @param {object} params
   * @param {'point'|'area'} [params.taskType='point']
   * @param {string} params.taskName
   * @param {object} params.params Task payload containing dates, layers, and coordinates or geo
   * @returns {Promise<object>}
   */
  async submitTask({ taskType = 'point', taskName, params }) {
    if (!taskName) {
      throw new AppeearsUpstreamError('taskName is required for AppEEARS task submission.', {
        statusCode: 400,
        integrationStatus: SATELLITE_STATUS.INVALID_PARAMETERS
      });
    }

    if (!params || !Array.isArray(params.dates) || !Array.isArray(params.layers)) {
      throw new AppeearsUpstreamError('AppEEARS task requires params with dates and layers arrays.', {
        statusCode: 400,
        integrationStatus: SATELLITE_STATUS.INVALID_PARAMETERS
      });
    }

    const payload = {
      task_type: taskType,
      task_name: taskName,
      params
    };

    const result = await this._request('post', '/task', { data: payload });
    return {
      taskId: result.task_id,
      status: result.status || 'pending',
      taskType,
      taskName
    };
  }

  /**
   * Retrieves status of an asynchronous processing task
   * 
   * @param {string} taskId
   * @returns {Promise<object>}
   */
  async getTaskStatus(taskId) {
    if (!taskId) {
      throw new AppeearsUpstreamError('taskId is required to retrieve task status.', {
        statusCode: 400,
        integrationStatus: SATELLITE_STATUS.INVALID_PARAMETERS
      });
    }

    const result = await this._request('get', `/task/${taskId}`);
    return {
      taskId: result.task_id || taskId,
      status: (result.status || 'pending').toLowerCase(),
      progress: result.progress ? Number(result.progress) : 0,
      created: result.created,
      updated: result.updated,
      error: result.error || null
    };
  }

  /**
   * Retrieves bundle file list for a completed task
   * 
   * @param {string} taskId
   * @returns {Promise<object>}
   */
  async getBundle(taskId) {
    if (!taskId) {
      throw new AppeearsUpstreamError('taskId is required to retrieve output bundle.', {
        statusCode: 400,
        integrationStatus: SATELLITE_STATUS.INVALID_PARAMETERS
      });
    }

    const result = await this._request('get', `/bundle/${taskId}`);
    const files = result.files || [];

    return {
      taskId,
      totalFiles: files.length,
      files: files.map(f => ({
        fileId: f.file_id,
        fileName: f.file_name,
        fileSize: f.file_size,
        fileType: f.file_type,
        sha256: f.sha256
      }))
    };
  }

  /**
   * Retrieves available satellite products from AppEEARS.
   * The /product endpoint is publicly accessible and does NOT require authentication.
   * Falls back to verified product catalog if upstream is unreachable.
   * 
   * @returns {Promise<object[]>}
   */
  async getProducts() {
    try {
      const client = this.httpClient || axios.create({
        baseURL: this.baseUrl,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KRISHI-MITRA/1.0.0'
        }
      });
      const url = this.httpClient ? `${this.baseUrl}/product` : '/product';
      const response = await client.get(url);
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      // Upstream failure or offline mode: return verified local catalog
    }
    return Object.values(NASA_SATELLITE_PRODUCTS);
  }
}

export const appeearsClient = new AppeearsClient();
export default appeearsClient;
