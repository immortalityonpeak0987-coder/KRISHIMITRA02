import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NasaPowerClient,
  NasaPowerUpstreamError
} from '../src/integrations/nasaPower/nasaPower.client.js';
import {
  NASA_POWER_CONFIG,
  INTEGRATION_STATUS
} from '../src/integrations/nasaPower/nasaPower.constants.js';

describe('Stage 4: NASA POWER HTTP Client & Error Handling Suite', () => {
  test('Successful upstream request returns JSON data payload', async () => {
    let capturedUrl = null;
    let capturedParams = null;

    const mockHttpClient = {
      get: async (url, options) => {
        capturedUrl = url;
        capturedParams = options.params;
        return {
          status: 200,
          data: {
            type: 'Feature',
            properties: {
              parameter: {
                T2M: { '20261101': 22.5 }
              }
            }
          }
        };
      }
    };

    const client = new NasaPowerClient({ httpClient: mockHttpClient });
    const result = await client.fetchDailyPointData({
      latitude: 23.2324,
      longitude: 88.3639,
      start: '20261101',
      end: '20261101',
      parameters: ['T2M']
    });

    assert.equal(capturedUrl, NASA_POWER_CONFIG.BASE_URL, 'Must strictly query base URL (SSRF protection)');
    assert.equal(capturedParams.latitude, 23.2324);
    assert.equal(capturedParams.longitude, 88.3639);
    assert.equal(capturedParams.start, '20261101');
    assert.equal(capturedParams.end, '20261101');
    assert.equal(capturedParams.community, 'AG');
    assert.equal(capturedParams.format, 'JSON');
    assert.equal(capturedParams.parameters, 'T2M');
    assert.equal(capturedParams['time-standard'], 'UTC', 'Must explicitly send time-standard=UTC');
    assert.ok(result.properties.parameter.T2M);
  });

  test('Upstream query explicitly enforces time-standard=UTC to prevent LST ambiguity', async () => {
    let sentTimeStandard = null;
    const mockHttpClient = {
      get: async (url, options) => {
        sentTimeStandard = options.params['time-standard'];
        return {
          status: 200,
          data: { type: 'Feature', properties: { parameter: {} } }
        };
      }
    };

    const client = new NasaPowerClient({ httpClient: mockHttpClient });
    await client.fetchDailyPointData({
      latitude: 23.0,
      longitude: 88.0,
      start: '20261101',
      end: '20261101',
      parameters: ['T2M']
    });

    assert.strictEqual(sentTimeStandard, 'UTC', 'Upstream request must explicitly set time-standard=UTC');
  });

  test('Upstream request timeout translates to 504 UPSTREAM_TIMEOUT error', async () => {
    const mockHttpClient = {
      get: async () => {
        const timeoutErr = new Error('timeout of 10000ms exceeded');
        timeoutErr.code = 'ECONNABORTED';
        throw timeoutErr;
      }
    };

    const client = new NasaPowerClient({ httpClient: mockHttpClient });

    await assert.rejects(async () => {
      await client.fetchDailyPointData({
        latitude: 23.0,
        longitude: 88.0,
        start: '20261101',
        end: '20261102',
        parameters: ['T2M']
      });
    }, (err) => {
      assert.ok(err instanceof NasaPowerUpstreamError);
      assert.equal(err.statusCode, 504);
      assert.equal(err.integrationStatus, INTEGRATION_STATUS.UPSTREAM_TIMEOUT);
      assert.ok(err.message.includes('timed out'));
      return true;
    });
  });

  test('Upstream 4xx client rejection translates to 502 UPSTREAM_ERROR', async () => {
    const mockHttpClient = {
      get: async () => {
        const err = new Error('Request failed with status code 400');
        err.response = {
          status: 400,
          data: {
            messages: ['Invalid latitude parameter']
          }
        };
        throw err;
      }
    };

    const client = new NasaPowerClient({ httpClient: mockHttpClient });

    await assert.rejects(async () => {
      await client.fetchDailyPointData({
        latitude: 99.0,
        longitude: 88.0,
        start: '20261101',
        end: '20261102',
        parameters: ['T2M']
      });
    }, (err) => {
      assert.ok(err instanceof NasaPowerUpstreamError);
      assert.equal(err.statusCode, 502);
      assert.equal(err.integrationStatus, INTEGRATION_STATUS.UPSTREAM_ERROR);
      assert.ok(err.message.includes('rejected query with status 400'));
      return true;
    });
  });

  test('Upstream 5xx server failure translates to 503 UPSTREAM_UNAVAILABLE', async () => {
    const mockHttpClient = {
      get: async () => {
        const err = new Error('Request failed with status code 503');
        err.response = {
          status: 503,
          data: 'Service Unavailable - NASA POWER under maintenance'
        };
        throw err;
      }
    };

    const client = new NasaPowerClient({ httpClient: mockHttpClient });

    await assert.rejects(async () => {
      await client.fetchDailyPointData({
        latitude: 23.0,
        longitude: 88.0,
        start: '20261101',
        end: '20261102',
        parameters: ['T2M']
      });
    }, (err) => {
      assert.ok(err instanceof NasaPowerUpstreamError);
      assert.equal(err.statusCode, 503);
      assert.equal(err.integrationStatus, INTEGRATION_STATUS.UPSTREAM_UNAVAILABLE);
      assert.ok(err.message.includes('maintenance'));
      return true;
    });
  });

  test('Network connectivity failure translates to 503 UPSTREAM_UNAVAILABLE', async () => {
    const mockHttpClient = {
      get: async () => {
        const err = new Error('getaddrinfo ENOTFOUND power.larc.nasa.gov');
        err.code = 'ENOTFOUND';
        throw err;
      }
    };

    const client = new NasaPowerClient({ httpClient: mockHttpClient });

    await assert.rejects(async () => {
      await client.fetchDailyPointData({
        latitude: 23.0,
        longitude: 88.0,
        start: '20261101',
        end: '20261102',
        parameters: ['T2M']
      });
    }, (err) => {
      assert.ok(err instanceof NasaPowerUpstreamError);
      assert.equal(err.statusCode, 503);
      assert.equal(err.integrationStatus, INTEGRATION_STATUS.UPSTREAM_UNAVAILABLE);
      assert.ok(err.message.includes('Failed to reach NASA POWER'));
      return true;
    });
  });

  test('Rejects empty or non-JSON upstream response with 502 UPSTREAM_ERROR', async () => {
    const mockHttpClient = {
      get: async () => ({
        status: 200,
        data: '' // Empty string instead of JSON object
      })
    };

    const client = new NasaPowerClient({ httpClient: mockHttpClient });

    await assert.rejects(async () => {
      await client.fetchDailyPointData({
        latitude: 23.0,
        longitude: 88.0,
        start: '20261101',
        end: '20261102',
        parameters: ['T2M']
      });
    }, (err) => {
      assert.ok(err instanceof NasaPowerUpstreamError);
      assert.equal(err.statusCode, 502);
      assert.equal(err.integrationStatus, INTEGRATION_STATUS.UPSTREAM_ERROR);
      assert.ok(err.message.includes('empty or non-JSON'));
      return true;
    });
  });
});
