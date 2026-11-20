import axios from 'axios';
import { NASA_POWER_CONFIG, INTEGRATION_STATUS } from './nasaPower.constants.js';

/**
 * Custom error class for NASA POWER upstream communication failures
 */
export class NasaPowerUpstreamError extends Error {
  constructor(message, { statusCode, statusText, integrationStatus, details = null } = {}) {
    super(message);
    this.name = 'NasaPowerUpstreamError';
    this.statusCode = statusCode || 502;
    this.statusText = statusText || 'Bad Gateway';
    this.integrationStatus = integrationStatus || INTEGRATION_STATUS.UPSTREAM_ERROR;
    this.details = details;
  }
}

/**
 * HTTP Client for NASA POWER API
 * Connects strictly to the official NASA POWER daily point endpoint.
 * Prevents SSRF by prohibiting dynamic or user-supplied URLs.
 */
export class NasaPowerClient {
  constructor(options = {}) {
    this.baseUrl = NASA_POWER_CONFIG.BASE_URL;
    this.timeout = options.timeout || NASA_POWER_CONFIG.DEFAULT_TIMEOUT_MS;
    this.httpClient = options.httpClient || axios.create({
      timeout: this.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KRISHI-MITRA/1.0.0'
      }
    });
  }

  /**
   * Fetches daily meteorological point observations from NASA POWER
   * @param {object} query
   * @param {number} query.latitude
   * @param {number} query.longitude
   * @param {string} query.start YYYYMMDD
   * @param {string} query.end YYYYMMDD
   * @param {string[]} query.parameters Array of verified parameter identifiers
   * @returns {Promise<object>} Upstream JSON response payload
   */
  async fetchDailyPointData({ latitude, longitude, start, end, parameters }) {
    const params = {
      parameters: parameters.join(','),
      community: NASA_POWER_CONFIG.COMMUNITY,
      longitude,
      latitude,
      start,
      end,
      format: NASA_POWER_CONFIG.OUTPUT_FORMAT,
      'time-standard': NASA_POWER_CONFIG.TIME_STANDARD // Explicitly request UTC (defaults to LST if omitted)
    };

    try {
      const response = await this.httpClient.get(this.baseUrl, { params });

      // Validate basic NASA POWER JSON contract
      if (!response.data || typeof response.data !== 'object') {
        throw new NasaPowerUpstreamError('NASA POWER returned an empty or non-JSON response.', {
          statusCode: 502,
          integrationStatus: INTEGRATION_STATUS.UPSTREAM_ERROR,
          details: { responseType: typeof response.data }
        });
      }

      return response.data;
    } catch (err) {
      if (err instanceof NasaPowerUpstreamError) {
        throw err;
      }

      // 1. Axios Timeout Error
      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        throw new NasaPowerUpstreamError(`NASA POWER API request timed out after ${this.timeout}ms.`, {
          statusCode: 504,
          statusText: 'Gateway Timeout',
          integrationStatus: INTEGRATION_STATUS.UPSTREAM_TIMEOUT,
          details: { timeoutMs: this.timeout }
        });
      }

      // 2. HTTP Error Responses from NASA POWER
      if (err.response) {
        const httpStatus = err.response.status;
        const responseBody = err.response.data;

        // Upstream 4xx (Bad request, validation issue at NASA POWER)
        if (httpStatus >= 400 && httpStatus < 500) {
          throw new NasaPowerUpstreamError(
            `NASA POWER rejected query with status ${httpStatus}: ${JSON.stringify(responseBody?.messages || responseBody || 'Bad Request')}`,
            {
              statusCode: 502,
              statusText: 'Bad Gateway',
              integrationStatus: INTEGRATION_STATUS.UPSTREAM_ERROR,
              details: { upstreamStatus: httpStatus, messages: responseBody?.messages }
            }
          );
        }

        // Upstream 5xx (NASA POWER server-side outage or maintenance)
        return (() => {
          throw new NasaPowerUpstreamError(
            `NASA POWER upstream server returned error status ${httpStatus}. Provider may be in maintenance.`,
            {
              statusCode: 503,
              statusText: 'Service Unavailable',
              integrationStatus: INTEGRATION_STATUS.UPSTREAM_UNAVAILABLE,
              details: { upstreamStatus: httpStatus }
            }
          );
        })();
      }

      // 3. Network or Connection Failures (DNS, TCP Refusal, Offline)
      throw new NasaPowerUpstreamError(`Failed to reach NASA POWER upstream: ${err.message}`, {
        statusCode: 503,
        statusText: 'Service Unavailable',
        integrationStatus: INTEGRATION_STATUS.UPSTREAM_UNAVAILABLE,
        details: { code: err.code, originalError: err.message }
      });
    }
  }
}

export const nasaPowerClient = new NasaPowerClient();
export default nasaPowerClient;
