import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CmrClient, CmrUpstreamError } from '../src/integrations/satellite/cmrClient.js';
import { SATELLITE_STATUS } from '../src/integrations/satellite/satelliteConfig.js';

describe('Stage 6: NASA CMR Client & Discovery Suite', () => {
  test('searchCollections queries CMR and normalizes collection metadata', async () => {
    let capturedUrl = null;
    let capturedParams = null;

    const mockHttpClient = {
      get: async (url, options) => {
        capturedUrl = url;
        capturedParams = options.params;
        return {
          status: 200,
          data: {
            feed: {
              hits: 1,
              entry: [
                {
                  id: 'C1748066515-LPCLOUD',
                  title: 'MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061',
                  short_name: 'MOD13Q1',
                  version_id: '061',
                  summary: '16-day composite Normalized Difference Vegetation Index (NDVI) at 250m resolution.',
                  time_start: '2000-02-18T00:00:00.000Z',
                  boxes: ['-90 -180 90 180'],
                  links: [{ rel: 'http://esipfed.org/ns/fed/data#', href: 'https://e4ftl01.cr.usgs.gov/MOLT/MOD13Q1.061/' }]
                }
              ]
            }
          }
        };
      }
    };

    const client = new CmrClient({ httpClient: mockHttpClient });
    const result = await client.searchCollections({ shortName: 'MOD13Q1', version: '061' });

    assert.equal(capturedUrl, 'https://cmr.earthdata.nasa.gov/search/collections.json');
    assert.equal(capturedParams.short_name, 'MOD13Q1');
    assert.equal(capturedParams.version, '061');
    assert.equal(result.total, 1);
    assert.equal(result.collections[0].shortName, 'MOD13Q1');
    assert.equal(result.collections[0].version, '061');
  });

  test('searchGranules queries granules with spatial bounding box and temporal filters', async () => {
    let capturedParams = null;

    const mockHttpClient = {
      get: async (url, options) => {
        capturedParams = options.params;
        return {
          status: 200,
          data: {
            feed: {
              hits: 2,
              entry: [
                {
                  id: 'G12345678-LPCLOUD',
                  title: 'MOD13Q1.A20261101.h26v06.061.2026120000000.hdf',
                  dataset_id: 'MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061',
                  time_start: '2026-11-01T00:00:00.000Z',
                  time_end: '2026-11-16T23:59:59.000Z',
                  granule_size: '24.5',
                  links: [{ rel: 'http://esipfed.org/ns/fed/data#', href: 'https://data.nasa.gov/MOD13Q1.tif' }]
                }
              ]
            }
          }
        };
      }
    };

    const client = new CmrClient({ httpClient: mockHttpClient });
    const result = await client.searchGranules({
      shortName: 'MOD13Q1',
      version: '061',
      boundingBox: '85.80,21.50,89.90,27.30',
      temporal: '2026-11-01T00:00:00Z,2026-11-16T23:59:59Z'
    });

    assert.equal(capturedParams.short_name, 'MOD13Q1');
    assert.equal(capturedParams.bounding_box, '85.80,21.50,89.90,27.30');
    assert.equal(capturedParams.temporal, '2026-11-01T00:00:00Z,2026-11-16T23:59:59Z');
    assert.equal(result.total, 2);
    assert.equal(result.granules[0].granuleSizeMB, 24.5);
    assert.equal(result.granules[0].downloadUrls[0], 'https://data.nasa.gov/MOD13Q1.tif');
  });

  test('searchGranules rejects missing shortName with 400 INVALID_PARAMETERS', async () => {
    const client = new CmrClient();
    await assert.rejects(
      async () => {
        await client.searchGranules({});
      },
      (err) => {
        assert.ok(err instanceof CmrUpstreamError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.integrationStatus, SATELLITE_STATUS.INVALID_PARAMETERS);
        return true;
      }
    );
  });

  test('Upstream timeout translates to 504 UPSTREAM_TIMEOUT error', async () => {
    const mockHttpClient = {
      get: async () => {
        const error = new Error('timeout of 15000ms exceeded');
        error.code = 'ECONNABORTED';
        throw error;
      }
    };

    const client = new CmrClient({ httpClient: mockHttpClient });
    await assert.rejects(
      async () => {
        await client.searchCollections({ keyword: 'MODIS' });
      },
      (err) => {
        assert.ok(err instanceof CmrUpstreamError);
        assert.equal(err.statusCode, 504);
        assert.equal(err.integrationStatus, SATELLITE_STATUS.UPSTREAM_TIMEOUT);
        return true;
      }
    );
  });

  test('Upstream 503 translates to 503 UPSTREAM_UNAVAILABLE', async () => {
    const mockHttpClient = {
      get: async () => {
        const error = new Error('Service Unavailable');
        error.response = { status: 503, data: 'CMR Maintenance' };
        throw error;
      }
    };

    const client = new CmrClient({ httpClient: mockHttpClient });
    await assert.rejects(
      async () => {
        await client.searchCollections({ keyword: 'GPM' });
      },
      (err) => {
        assert.ok(err instanceof CmrUpstreamError);
        assert.equal(err.statusCode, 503);
        assert.equal(err.integrationStatus, SATELLITE_STATUS.UPSTREAM_UNAVAILABLE);
        return true;
      }
    );
  });

  test('SSRF prevention restricts base URL to authorized CMR domains', async () => {
    const client = new CmrClient({ baseUrl: 'http://malicious-internal-server.local' });
    await assert.rejects(
      async () => {
        await client.searchCollections({ keyword: 'test' });
      },
      (err) => {
        assert.match(err.message, /SSRF|authorized/i);
        return true;
      }
    );
  });
});
