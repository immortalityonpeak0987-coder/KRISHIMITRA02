import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { appeearsClient } from '../src/integrations/satellite/appeearsClient.js';

describe('NASA AppEEARS Dedicated Routes Suite (/api and /api/v1)', () => {
  let app;

  before(() => {
    app = createApp();
  });

  it('GET /api/integrations/appeears/status returns 200 with operational metadata', async () => {
    const res = await request(app)
      .get('/api/integrations/appeears/status')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.provider, 'NASA AppEEARS');
    assert.strictEqual(res.body.data.serviceType, 'ASYNCHRONOUS_SUBSETTING_ENGINE');
  });

  it('GET /api/v1/integrations/appeears/status returns 200 (Dual-Mount Parity)', async () => {
    const res = await request(app)
      .get('/api/v1/integrations/appeears/status')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.provider, 'NASA AppEEARS');
  });

  it('GET /api/integrations/appeears/products returns product catalog', async () => {
    const res = await request(app)
      .get('/api/integrations/appeears/products')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  it('GET /api/v1/integrations/appeears/products returns equivalent catalog', async () => {
    const res = await request(app)
      .get('/api/v1/integrations/appeears/products')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/integrations/appeears/tasks rejects missing taskName with 400', async () => {
    const res = await request(app)
      .post('/api/integrations/appeears/tasks')
      .send({ taskType: 'point' })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'INVALID_PARAMETERS');
  });

  it('POST /api/integrations/appeears/tasks submits mock task and returns 202', async () => {
    const origHasCreds = appeearsClient.hasCredentials;
    const origSubmit = appeearsClient.submitTask;
    appeearsClient.hasCredentials = () => true;
    appeearsClient.submitTask = async () => ({
      taskId: 'test-appeears-id-12345',
      status: 'pending',
      taskType: 'point',
      taskName: 'Hooghly Farm Test'
    });

    try {
      const res = await request(app)
        .post('/api/integrations/appeears/tasks')
        .send({
          taskName: 'Hooghly Farm Test',
          taskType: 'point',
          params: {
            dates: [{ startDate: '05-01-2024', endDate: '05-10-2024' }],
            layers: [{ product: 'MOD13Q1.061', layer: '_250m_16_days_NDVI' }],
            coordinates: [{ latitude: 22.90, longitude: 88.39, id: 'point-1' }]
          }
        })
        .expect(202);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.taskId, 'test-appeears-id-12345');
      assert.strictEqual(res.body.data.status, 'pending');
    } finally {
      appeearsClient.hasCredentials = origHasCreds;
      appeearsClient.submitTask = origSubmit;
    }
  });

  it('GET /api/integrations/appeears/tasks/:taskId returns task progression status', async () => {
    const origStatus = appeearsClient.getTaskStatus;
    appeearsClient.getTaskStatus = async (id) => ({
      taskId: id,
      status: 'processing',
      progress: 65,
      created: '2024-05-01T10:00:00Z',
      updated: '2024-05-01T10:05:00Z'
    });

    try {
      const res = await request(app)
        .get('/api/integrations/appeears/tasks/test-task-12345')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'processing');
      assert.strictEqual(res.body.data.progress, 65);
    } finally {
      appeearsClient.getTaskStatus = origStatus;
    }
  });

  it('GET /api/integrations/appeears/tasks/:taskId/results returns completed bundle files', async () => {
    const origBundle = appeearsClient.getBundle;
    appeearsClient.getBundle = async (id) => ({
      taskId: id,
      totalFiles: 2,
      files: [
        { fileId: 'f1', fileName: 'MOD13Q1_NDVI.csv', fileSize: 1024, fileType: 'csv', sha256: 'abc' },
        { fileId: 'f2', fileName: 'MOD13Q1_Quality.csv', fileSize: 512, fileType: 'csv', sha256: 'def' }
      ]
    });

    try {
      const res = await request(app)
        .get('/api/integrations/appeears/tasks/test-task-12345/results')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.totalFiles, 2);
    } finally {
      appeearsClient.getBundle = origBundle;
    }
  });
});
