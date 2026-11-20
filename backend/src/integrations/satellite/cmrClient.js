/**
 * NASA Common Metadata Repository (CMR) Client
 * 
 * Catalog search for NASA Earth science collections and observation granules.
 * Endpoint: https://cmr.earthdata.nasa.gov/search
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import axios from 'axios';
import { config } from '../../config/env.js';
import { SATELLITE_CONFIG, SATELLITE_STATUS } from './satelliteConfig.js';

export class CmrUpstreamError extends Error {
  constructor(message, { statusCode = 502, integrationStatus = SATELLITE_STATUS.UPSTREAM_ERROR, details = null } = {}) {
    super(message);
    this.name = 'CmrUpstreamError';
    this.statusCode = statusCode;
    this.integrationStatus = integrationStatus;
    this.details = details;
  }
}

export class CmrClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || config.satellite?.cmrBaseUrl || SATELLITE_CONFIG.CMR_BASE_URL;
    this.timeout = options.timeout || config.satellite?.timeoutMs || SATELLITE_CONFIG.DEFAULT_TIMEOUT_MS;
    this.httpClient = options.httpClient || null;
  }

  _getHeaders() {
    return {
      'Accept': 'application/json',
      'User-Agent': 'KRISHI-MITRA/1.0.0'
    };
  }

  async _request(endpoint, params = {}) {
    // SSRF prevention: ensure target is official CMR domain
    const allowed = ['https://cmr.earthdata.nasa.gov', 'http://localhost', 'http://127.0.0.1'];
    if (!allowed.some(p => this.baseUrl.startsWith(p))) {
      throw new CmrUpstreamError(`SSRF protection: Base URL '${this.baseUrl}' is not an authorized CMR domain.`, {
        statusCode: 400,
        integrationStatus: SATELLITE_STATUS.INVALID_PARAMETERS
      });
    }

    const client = this.httpClient || axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: this._getHeaders()
    });

    try {
      const url = this.httpClient ? `${this.baseUrl}${endpoint}` : endpoint;
      const response = await client.get(url, {
        params,
        headers: this._getHeaders()
      });

      if (!response.data || typeof response.data !== 'object') {
        throw new CmrUpstreamError('CMR API returned an empty or malformed non-JSON response.', {
          statusCode: 502,
          integrationStatus: SATELLITE_STATUS.UPSTREAM_ERROR
        });
      }

      return response.data;
    } catch (err) {
      if (err instanceof CmrUpstreamError) throw err;

      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        throw new CmrUpstreamError(`CMR API request timed out after ${this.timeout}ms.`, {
          statusCode: 504,
          integrationStatus: SATELLITE_STATUS.UPSTREAM_TIMEOUT
        });
      }

      if (err.response) {
        const status = err.response.status;
        if (status >= 500) {
          throw new CmrUpstreamError(`CMR server error (${status}): Upstream catalog service temporarily unavailable.`, {
            statusCode: 503,
            integrationStatus: SATELLITE_STATUS.UPSTREAM_UNAVAILABLE,
            details: { upstreamStatus: status }
          });
        }

        throw new CmrUpstreamError(`CMR search rejected with status ${status}: ${JSON.stringify(err.response.data || 'Client Error')}`, {
          statusCode: status === 400 ? 400 : 502,
          integrationStatus: status === 400 ? SATELLITE_STATUS.INVALID_PARAMETERS : SATELLITE_STATUS.UPSTREAM_ERROR,
          details: { error: err.response.data }
        });
      }

      throw new CmrUpstreamError(`Failed to connect to NASA CMR: ${err.message}`, {
        statusCode: 503,
        integrationStatus: SATELLITE_STATUS.UPSTREAM_UNAVAILABLE
      });
    }
  }

  /**
   * Searches NASA collections by keyword, short_name, and spatial bounding box
   * 
   * @param {object} params
   * @param {string} [params.keyword] Free text search
   * @param {string} [params.shortName] Product short name (e.g. 'MOD13Q1', 'SPL3SMP_E')
   * @param {string} [params.version] Product version (e.g. '061', '006')
   * @param {string} [params.boundingBox] minLon,minLat,maxLon,maxLat
   * @param {number} [params.pageSize=10] Max entries to return
   * @returns {Promise<object>}
   */
  async searchCollections({ keyword, shortName, version, boundingBox, pageSize = 10 } = {}) {
    const query = { page_size: pageSize };
    if (keyword) query.keyword = keyword;
    if (shortName) query.short_name = shortName;
    if (version) query.version = version;
    if (boundingBox) query.bounding_box = boundingBox;

    const data = await this._request('/collections.json', query);
    const entries = data.feed?.entry || [];

    return {
      total: data.feed?.hits ?? entries.length,
      collections: entries.map(col => ({
        id: col.id,
        title: col.title,
        shortName: col.short_name,
        version: col.version_id,
        summary: col.summary,
        timeStart: col.time_start,
        timeEnd: col.time_end,
        boxes: col.boxes || [],
        links: (col.links || []).filter(l => l.rel?.includes('data#') || l.href?.endsWith('.json'))
      }))
    };
  }

  /**
   * Searches observation granules matching spatial and temporal constraints
   * 
   * @param {object} params
   * @param {string} params.shortName Product short name
   * @param {string} [params.version] Product version
   * @param {string} [params.boundingBox] minLon,minLat,maxLon,maxLat
   * @param {string} [params.point] lon,lat
   * @param {string} [params.temporal] ISO temporal range 'YYYY-MM-DDTHH:MM:SSZ,YYYY-MM-DDTHH:MM:SSZ'
   * @param {number} [params.pageSize=10]
   * @returns {Promise<object>}
   */
  async searchGranules({ shortName, version, boundingBox, point, temporal, pageSize = 10 } = {}) {
    if (!shortName) {
      throw new CmrUpstreamError('Granule search requires a product shortName (e.g. MOD13Q1).', {
        statusCode: 400,
        integrationStatus: SATELLITE_STATUS.INVALID_PARAMETERS
      });
    }

    const query = {
      short_name: shortName,
      page_size: pageSize,
      sort_key: '-start_date'
    };

    if (version) query.version = version;
    if (boundingBox) query.bounding_box = boundingBox;
    if (point) query.point = point;
    if (temporal) query.temporal = temporal;

    const data = await this._request('/granules.json', query);
    const entries = data.feed?.entry || [];

    return {
      total: data.feed?.hits ?? entries.length,
      granules: entries.map(g => ({
        id: g.id,
        title: g.title,
        datasetId: g.dataset_id,
        timeStart: g.time_start,
        timeEnd: g.time_end,
        granuleSizeMB: g.granule_size ? Number((Number(g.granule_size)).toFixed(2)) : null,
        boxes: g.boxes || [],
        downloadUrls: (g.links || [])
          .filter(l => l.rel?.includes('data#') && (l.href?.endsWith('.tif') || l.href?.endsWith('.h5') || l.href?.endsWith('.nc4')))
          .map(l => l.href)
      }))
    };
  }
}

export const cmrClient = new CmrClient();
export default cmrClient;
