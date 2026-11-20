import axios from 'axios';
import { config } from '../../config/env.js';
import { IMD_CONFIG, IMD_STATUS, IMD_AVAILABILITY_STATES } from './imd.constants.js';

/**
 * Custom error class for IMD upstream communication failures
 */
export class ImdUpstreamError extends Error {
  constructor(message, { statusCode, statusText, integrationStatus, availabilityState = null, details = null } = {}) {
    super(message);
    this.name = 'ImdUpstreamError';
    this.statusCode = statusCode || 502;
    this.statusText = statusText || 'Bad Gateway';
    this.integrationStatus = integrationStatus || IMD_STATUS.UPSTREAM_ERROR;
    this.availabilityState = availabilityState;
    this.details = details;
  }
}

/**
 * HTTP Client for India Meteorological Department (IMD) API
 * Connects to official IMD API gateway (https://api.imd.gov.in/api/v1).
 * Supports dual-header authentication (X-Api-Key + Authorization Bearer JWT).
 * Prohibits dynamic user-supplied URLs to prevent SSRF vulnerabilities.
 */
export class ImdClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || config.imd?.baseUrl || IMD_CONFIG.DEFAULT_BASE_URL;
    this.apiKey = options.apiKey !== undefined ? options.apiKey : (config.imd?.apiKey || '');
    this.bearerToken = options.bearerToken !== undefined ? options.bearerToken : (config.imd?.bearerToken || '');
    this.timeout = options.timeout || config.imd?.timeoutMs || IMD_CONFIG.DEFAULT_TIMEOUT_MS;
    this.httpClient = options.httpClient || null;
  }

  /**
   * Checks whether IMD credentials are configured in environment
   * @returns {boolean}
   */
  hasCredentials() {
    return Boolean(
      (this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'your_imd_api_key_here') ||
      (this.bearerToken && this.bearerToken.trim() !== '' && this.bearerToken !== 'your_imd_bearer_token_here')
    );
  }

  /**
   * Builds request headers with credentials (if available)
   * Sanitizes header construction to prevent secret leakage in logs.
   * @private
   */
  _buildHeaders() {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'KRISHI-MITRA/1.0.0'
    };

    if (this.apiKey && this.apiKey.trim() !== '') {
      headers['X-Api-Key'] = this.apiKey.trim();
    }

    if (this.bearerToken && this.bearerToken.trim() !== '') {
      headers['Authorization'] = `Bearer ${this.bearerToken.trim()}`;
    }

    return headers;
  }

  /**
   * Internal request executor
   * @private
   */
  async _request(endpoint, params = {}) {
    // 0. SSRF validation: restrict base URL to official domains or test hosts
    const allowedPrefixes = [
      'https://api.imd.gov.in',
      'https://mausam.imd.gov.in',
      'http://localhost',
      'http://127.0.0.1'
    ];
    const isAllowedBase = allowedPrefixes.some(p => this.baseUrl.startsWith(p));
    if (!isAllowedBase) {
      throw new ImdUpstreamError(
        `SSRF protection: Disallowed upstream base URL '${this.baseUrl}'. Requests must target official IMD endpoints.`,
        {
          statusCode: 400,
          integrationStatus: IMD_STATUS.INVALID_PARAMETERS,
          availabilityState: IMD_AVAILABILITY_STATES.ERROR
        }
      );
    }

    // 1. If no credentials configured, fail fast with AWAITING_CREDENTIALS
    if (!this.hasCredentials()) {
      throw new ImdUpstreamError(
        'IMD API credentials (API key or Bearer JWT) are not configured in environment.',
        {
          statusCode: 401,
          statusText: 'Unauthorized',
          availabilityState: IMD_AVAILABILITY_STATES.AWAITING_CREDENTIALS,
          integrationStatus: IMD_STATUS.AWAITING_CREDENTIALS,
          details: { missingCredentials: ['IMD_API_KEY', 'IMD_BEARER_TOKEN'] }
        }
      );
    }

    const client = this.httpClient || axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: this._buildHeaders()
    });

    try {
      const response = await client.get(
        this.httpClient ? `${this.baseUrl}${endpoint}` : endpoint,
        {
          params,
          headers: this._buildHeaders()
        }
      );

      if (!response.data || typeof response.data !== 'object') {
        throw new ImdUpstreamError('IMD API returned an empty or non-JSON response.', {
          statusCode: 502,
          integrationStatus: IMD_STATUS.UPSTREAM_ERROR,
          availabilityState: IMD_AVAILABILITY_STATES.ERROR,
          details: { responseType: typeof response.data }
        });
      }

      return response.data;
    } catch (err) {
      if (err instanceof ImdUpstreamError) {
        throw err;
      }

      // 1. Request Timeout
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        throw new ImdUpstreamError(`IMD API request timed out after ${this.timeout}ms.`, {
          statusCode: 504,
          statusText: 'Gateway Timeout',
          availabilityState: IMD_AVAILABILITY_STATES.UNAVAILABLE,
          integrationStatus: IMD_STATUS.UPSTREAM_TIMEOUT,
          details: { timeoutMs: this.timeout }
        });
      }

      // 2. HTTP Responses from IMD Gateway
      if (err.response) {
        const httpStatus = err.response.status;
        const responseData = err.response.data;

        // 401: Missing or invalid API key / token
        if (httpStatus === 401) {
          throw new ImdUpstreamError(
            `IMD API authentication failed (401): ${responseData?.error || 'Invalid or missing API key / JWT'}`,
            {
              statusCode: 401,
              statusText: 'Unauthorized',
              availabilityState: IMD_AVAILABILITY_STATES.AWAITING_CREDENTIALS,
              integrationStatus: IMD_STATUS.AWAITING_CREDENTIALS,
              details: { error: responseData?.error || 'Authentication required' }
            }
          );
        }

        // 403: Forbidden (IP Whitelisting or Institutional Approval required)
        if (httpStatus === 403) {
          throw new ImdUpstreamError(
            'IMD API access forbidden (403). Static IP whitelisting or institutional authorization is pending.',
            {
              statusCode: 403,
              statusText: 'Forbidden',
              availabilityState: IMD_AVAILABILITY_STATES.AWAITING_IP_APPROVAL,
              integrationStatus: IMD_STATUS.AWAITING_IP_APPROVAL,
              details: { error: responseData?.error || 'Access forbidden / IP not registered' }
            }
          );
        }

        // 404: Endpoint not found
        if (httpStatus === 404) {
          throw new ImdUpstreamError(`IMD endpoint '${endpoint}' was not found upstream (404).`, {
            statusCode: 404,
            statusText: 'Not Found',
            availabilityState: IMD_AVAILABILITY_STATES.ERROR,
            integrationStatus: IMD_STATUS.UPSTREAM_ERROR
          });
        }

        // 429: Rate limit exceeded
        if (httpStatus === 429) {
          throw new ImdUpstreamError('IMD API rate limit exceeded (429). Bounded backoff required.', {
            statusCode: 429,
            statusText: 'Too Many Requests',
            availabilityState: IMD_AVAILABILITY_STATES.ERROR,
            integrationStatus: IMD_STATUS.UPSTREAM_ERROR
          });
        }

        // 5xx: Server errors at IMD
        if (httpStatus >= 500) {
          throw new ImdUpstreamError(
            `IMD upstream server returned error status ${httpStatus}. Service may be under maintenance.`,
            {
              statusCode: 503,
              statusText: 'Service Unavailable',
              availabilityState: IMD_AVAILABILITY_STATES.UNAVAILABLE,
              integrationStatus: IMD_STATUS.UPSTREAM_UNAVAILABLE,
              details: { upstreamStatus: httpStatus }
            }
          );
        }

        // Other 4xx
        throw new ImdUpstreamError(
          `IMD query rejected with status ${httpStatus}: ${JSON.stringify(responseData?.error || responseData || 'Client Error')}`,
          {
            statusCode: 502,
            availabilityState: IMD_AVAILABILITY_STATES.ERROR,
            integrationStatus: IMD_STATUS.UPSTREAM_ERROR,
            details: { upstreamStatus: httpStatus }
          }
        );
      }

      // 3. Network Connection Failures (DNS, TCP Reset, Network Offline)
      throw new ImdUpstreamError(`Failed to reach IMD upstream: ${err.message}`, {
        statusCode: 503,
        statusText: 'Service Unavailable',
        availabilityState: IMD_AVAILABILITY_STATES.UNAVAILABLE,
        integrationStatus: IMD_STATUS.UPSTREAM_UNAVAILABLE,
        details: { code: err.code, originalError: err.message }
      });
    }
  }

  request(endpoint, params = {}) {
    return this._request(endpoint, params);
  }

  async fetchCurrentWeather(params = {}) {
    const query = {};
    if (params.stationId || params.station_id) {
      query.station_id = params.stationId || params.station_id;
    }
    if (params.district) {
      query.district = params.district;
    }
    return this._request(IMD_CONFIG.ENDPOINTS.CURRENT_WX, query);
  }

  async getCurrentWeather(params = {}) {
    return this.fetchCurrentWeather(params);
  }

  async fetchDistrictRainfall(params = {}) {
    const query = {};
    if (params.district) query.district = params.district;
    if (params.date) query.date = params.date;
    return this._request(IMD_CONFIG.ENDPOINTS.DISTRICT_RAINFALL, query);
  }

  async getDistrictRainfall(params = {}) {
    return this.fetchDistrictRainfall(params);
  }

  async fetchStateRainfall(params = {}) {
    const query = {};
    if (params.date) query.date = params.date;
    return this._request(IMD_CONFIG.ENDPOINTS.STATE_RAINFALL, query);
  }

  async getStateRainfall(params = {}) {
    return this.fetchStateRainfall(params);
  }

  async fetchAwsData(params = {}) {
    const query = {};
    if (params.stationId || params.station_id) query.station_id = params.stationId || params.station_id;
    if (params.district) query.district = params.district;
    return this._request(IMD_CONFIG.ENDPOINTS.AWS_DATA, query);
  }

  async getAwsData(params = {}) {
    return this.fetchAwsData(params);
  }
}

export const imdClient = new ImdClient();
export default imdClient;
