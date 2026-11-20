import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ImdClient,
  ImdUpstreamError
} from '../src/integrations/imd/imd.client.js';
import {
  IMD_CONFIG,
  IMD_STATUS,
  IMD_AVAILABILITY_STATES
} from '../src/integrations/imd/imd.constants.js';

describe('Stage 5: IMD HTTP Client & Authentication Handling Suite', () => {
  test('Successful upstream request attaches dual credentials and returns JSON data', async () => {
    let capturedUrl = null;
    let capturedHeaders = null;
    let capturedParams = null;

    const mockHttpClient = {
      get: async (url, options) => {
        capturedUrl = url;
        capturedHeaders = options.headers;
        capturedParams = options.params;
        return {
          status: 200,
          data: [
            {
              station_id: '42809',
              station_name: 'Kolkata (Alipore)',
              temp: 31.4,
              rh: 72,
              wind_speed: 3.2,
              rainfall: 0.0,
              observation_time: '2026-11-15 08:30:00'
            }
          ]
        };
      }
    };

    const client = new ImdClient({
      apiKey: 'test-api-key-12345',
      bearerToken: 'test-jwt-token-67890',
      httpClient: mockHttpClient
    });

    const result = await client.getCurrentWeather({ stationId: '42809' });

    assert.equal(capturedUrl, 'https://api.imd.gov.in/api/v1/current_wx');
    assert.equal(capturedHeaders['X-Api-Key'], 'test-api-key-12345');
    assert.equal(capturedHeaders['Authorization'], 'Bearer test-jwt-token-67890');
    assert.equal(capturedHeaders['Accept'], 'application/json');
    assert.equal(capturedParams.station_id, '42809');
    assert.ok(Array.isArray(result));
    assert.equal(result[0].station_id, '42809');
  });

  test('Missing credentials safely throws AWAITING_CREDENTIALS error without leaking or crashing', async () => {
    const client = new ImdClient({
      apiKey: '',
      bearerToken: '',
      httpClient: {}
    });

    assert.equal(client.hasCredentials(), false);

    await assert.rejects(
      async () => {
        await client.getCurrentWeather({ stationId: '42809' });
      },
      (err) => {
        assert.ok(err instanceof ImdUpstreamError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.availabilityState, IMD_AVAILABILITY_STATES.AWAITING_CREDENTIALS);
        assert.equal(err.integrationStatus, IMD_STATUS.AWAITING_CREDENTIALS);
        assert.match(err.message, /credentials/i);
        return true;
      }
    );
  });

  test('Upstream 401 Unauthorized translates to AWAITING_CREDENTIALS', async () => {
    const mockHttpClient = {
      get: async () => {
        const error = new Error('Request failed with status code 401');
        error.response = {
          status: 401,
          statusText: 'Unauthorized',
          data: { error: 'Invalid or expired JWT token' }
        };
        throw error;
      }
    };

    const client = new ImdClient({
      apiKey: 'configured-key',
      bearerToken: 'configured-token',
      httpClient: mockHttpClient
    });

    await assert.rejects(
      async () => {
        await client.getCurrentWeather({ stationId: '42809' });
      },
      (err) => {
        assert.ok(err instanceof ImdUpstreamError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.availabilityState, IMD_AVAILABILITY_STATES.AWAITING_CREDENTIALS);
        assert.equal(err.integrationStatus, IMD_STATUS.AWAITING_CREDENTIALS);
        return true;
      }
    );
  });

  test('Upstream 403 Forbidden translates to AWAITING_IP_APPROVAL', async () => {
    const mockHttpClient = {
      get: async () => {
        const error = new Error('Request failed with status code 403');
        error.response = {
          status: 403,
          statusText: 'Forbidden',
          data: { error: 'IP address not authorized by IMD network security' }
        };
        throw error;
      }
    };

    const client = new ImdClient({
      apiKey: 'configured-key',
      bearerToken: 'configured-token',
      httpClient: mockHttpClient
    });

    await assert.rejects(
      async () => {
        await client.getDistrictRainfall({ district: 'Bankura' });
      },
      (err) => {
        assert.ok(err instanceof ImdUpstreamError);
        assert.equal(err.statusCode, 403);
        assert.equal(err.availabilityState, IMD_AVAILABILITY_STATES.AWAITING_IP_APPROVAL);
        assert.equal(err.integrationStatus, IMD_STATUS.AWAITING_IP_APPROVAL);
        return true;
      }
    );
  });

  test('Upstream timeout translates to 504 UPSTREAM_TIMEOUT error', async () => {
    const mockHttpClient = {
      get: async () => {
        const error = new Error('timeout of 10000ms exceeded');
        error.code = 'ECONNABORTED';
        throw error;
      }
    };

    const client = new ImdClient({
      apiKey: 'configured-key',
      bearerToken: 'configured-token',
      httpClient: mockHttpClient
    });

    await assert.rejects(
      async () => {
        await client.getStateRainfall();
      },
      (err) => {
        assert.ok(err instanceof ImdUpstreamError);
        assert.equal(err.statusCode, 504);
        assert.equal(err.integrationStatus, IMD_STATUS.UPSTREAM_TIMEOUT);
        assert.equal(err.availabilityState, IMD_AVAILABILITY_STATES.UNAVAILABLE);
        return true;
      }
    );
  });

  test('Upstream 5xx server failure translates to 503 UPSTREAM_UNAVAILABLE', async () => {
    const mockHttpClient = {
      get: async () => {
        const error = new Error('Request failed with status code 503');
        error.response = {
          status: 503,
          statusText: 'Service Unavailable',
          data: 'Mausam Gateway Down for Maintenance'
        };
        throw error;
      }
    };

    const client = new ImdClient({
      apiKey: 'configured-key',
      bearerToken: 'configured-token',
      httpClient: mockHttpClient
    });

    await assert.rejects(
      async () => {
        await client.getAwsData({ stationId: '42809' });
      },
      (err) => {
        assert.ok(err instanceof ImdUpstreamError);
        assert.equal(err.statusCode, 503);
        assert.equal(err.integrationStatus, IMD_STATUS.UPSTREAM_UNAVAILABLE);
        assert.equal(err.availabilityState, IMD_AVAILABILITY_STATES.UNAVAILABLE);
        return true;
      }
    );
  });

  test('SSRF prevention restricts endpoint requests to allowed IMD paths', async () => {
    const client = new ImdClient({
      baseUrl: 'http://malicious-internal-server.local/api',
      apiKey: 'key',
      bearerToken: 'token',
      httpClient: {}
    });

    await assert.rejects(
      async () => {
        await client.request('/current_wx');
      },
      (err) => {
        assert.match(err.message, /SSRF|non-allowed/i);
        return true;
      }
    );
  });
});
