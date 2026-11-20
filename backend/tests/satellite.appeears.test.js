import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { AppeearsClient, AppeearsUpstreamError } from '../src/integrations/satellite/appeearsClient.js';
import { SATELLITE_STATUS } from '../src/integrations/satellite/satelliteConfig.js';

describe('Stage 6: NASA AppEEARS Client & Asynchronous Engine Suite', () => {
  test('Authentication flow exchanges basic credentials for session token', async () => {
    let capturedHeaders = null;
    const mockHttpClient = {
      post: async (url, body, options) => {
        capturedHeaders = options.headers;
        return {
          status: 200,
          data: {
            token: 'mock-appeears-bearer-token-12345',
            expiration: new Date(Date.now() + 3600000).toISOString()
          }
        };
      }
    };

    const client = new AppeearsClient({
      username: 'test_earthdata_user',
      password: 'test_earthdata_password',
      httpClient: mockHttpClient
    });

    const token = await client.login();
    assert.equal(token, 'mock-appeears-bearer-token-12345');
    assert.match(capturedHeaders.Authorization, /^Basic /);
  });

  test('Missing Earthdata credentials throws AWAITING_CREDENTIALS without crashing', async () => {
    const client = new AppeearsClient({
      username: '',
      password: '',
      bearerToken: '',
      httpClient: {}
    });

    assert.equal(client.hasCredentials(), false);
    await assert.rejects(
      async () => {
        await client.login();
      },
      (err) => {
        assert.ok(err instanceof AppeearsUpstreamError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.integrationStatus, SATELLITE_STATUS.AWAITING_CREDENTIALS);
        return true;
      }
    );
  });

  test('submitTask submits point extraction task and returns task ID', async () => {
    let capturedMethod = null;
    let capturedPayload = null;

    const mockHttpClient = (options) => {
      capturedMethod = options.method;
      capturedPayload = options.data;
      return Promise.resolve({
        data: {
          task_id: '7b78f921-9989-4c07-b359-25ea885a528e',
          status: 'pending'
        }
      });
    };
    mockHttpClient.post = (url, body, opt) => Promise.resolve({
      data: { token: 'mock-token', expiration: new Date(Date.now() + 3600000).toISOString() }
    });

    const client = new AppeearsClient({
      bearerToken: 'valid-test-token',
      httpClient: mockHttpClient
    });

    const taskParams = {
      dates: [{ startDate: '05-01-2026', endDate: '05-16-2026' }],
      layers: [{ product: 'MOD13Q1.061', layer: '_250m_16_days_NDVI' }],
      coordinates: [{ id: 'farm_purba_bardhaman', latitude: 23.2324, longitude: 87.8639 }]
    };

    const result = await client.submitTask({
      taskType: 'point',
      taskName: 'KrishiMitra_Burdwan_NDVI',
      params: taskParams
    });

    assert.equal(result.taskId, '7b78f921-9989-4c07-b359-25ea885a528e');
    assert.equal(result.status, 'pending');
    assert.equal(capturedPayload.task_name, 'KrishiMitra_Burdwan_NDVI');
    assert.equal(capturedPayload.task_type, 'point');
  });

  test('submitTask rejects missing taskName or layers with 400 INVALID_PARAMETERS', async () => {
    const client = new AppeearsClient({ bearerToken: 'valid-token', httpClient: () => {} });
    await assert.rejects(
      async () => {
        await client.submitTask({ taskName: '', params: {} });
      },
      (err) => {
        assert.ok(err instanceof AppeearsUpstreamError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.integrationStatus, SATELLITE_STATUS.INVALID_PARAMETERS);
        return true;
      }
    );
  });

  test('getTaskStatus retrieves async processing progression', async () => {
    const mockHttpClient = (options) => Promise.resolve({
      data: {
        task_id: '7b78f921-9989-4c07-b359-25ea885a528e',
        status: 'done',
        progress: 100,
        created: '2026-11-15T00:00:00Z',
        updated: '2026-11-15T00:05:00Z'
      }
    });

    const client = new AppeearsClient({ bearerToken: 'valid-token', httpClient: mockHttpClient });
    const status = await client.getTaskStatus('7b78f921-9989-4c07-b359-25ea885a528e');

    assert.equal(status.taskId, '7b78f921-9989-4c07-b359-25ea885a528e');
    assert.equal(status.status, 'done');
    assert.equal(status.progress, 100);
  });

  test('getBundle returns file list and checksums for completed task', async () => {
    const mockHttpClient = (options) => Promise.resolve({
      data: {
        files: [
          {
            file_id: 'file_001',
            file_name: 'MOD13Q1-061-Statistics.csv',
            file_size: 104857,
            file_type: 'csv',
            sha256: 'a1b2c3d4e5f6...'
          }
        ]
      }
    });

    const client = new AppeearsClient({ bearerToken: 'valid-token', httpClient: mockHttpClient });
    const bundle = await client.getBundle('7b78f921-9989-4c07-b359-25ea885a528e');

    assert.equal(bundle.totalFiles, 1);
    assert.equal(bundle.files[0].fileName, 'MOD13Q1-061-Statistics.csv');
  });
});
