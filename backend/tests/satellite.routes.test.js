import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { cmrClient } from '../src/integrations/satellite/cmrClient.js';
import { appeearsClient } from '../src/integrations/satellite/appeearsClient.js';

describe('Stage 6: Satellite Routes & Dual-Mount Parity Suite', () => {
  const app = createApp();

  test('GET /api/integrations/satellite/status returns 200 with operational metadata', async () => {
    const res = await request(app)
      .get('/api/integrations/satellite/status')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.provider, 'NASA_SATELLITE_INTEGRATION');
    assert.ok(res.body.data.services.cmr);
    assert.ok(res.body.data.services.appeears);
    assert.ok(res.body.data.services.modis);
    assert.ok(res.body.data.services.smap);
    assert.ok(res.body.data.services.gpm);
    assert.match(res.body.data.disclaimer, /Coarse products/i);
  });

  test('GET /api/v1/integrations/satellite/status returns equivalent response (Dual-Mount Parity)', async () => {
    const res = await request(app)
      .get('/api/v1/integrations/satellite/status')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.supportedProductsCount, 6);
  });

  test('GET /api/integrations/satellite/products returns verified NASA product catalog', async () => {
    const res = await request(app)
      .get('/api/integrations/satellite/products')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.products.MODIS_NDVI);
    assert.ok(res.body.data.products.SMAP_SOIL_MOISTURE_L3);
    assert.ok(res.body.data.products.GPM_IMERG_LATE);
    assert.equal(res.body.data.products.MODIS_NDVI.scaleFactor, 0.0001);
  });

  test('GET /api/v1/integrations/satellite/products returns equivalent catalog', async () => {
    const res = await request(app)
      .get('/api/v1/integrations/satellite/products')
      .expect(200);

    assert.equal(res.body.success, true);
  });

  test('GET /api/integrations/satellite/search queries CMR and returns 200', async () => {
    const origSearch = cmrClient.searchCollections;
    cmrClient.searchCollections = async () => ({
      total: 1,
      collections: [
        {
          id: 'C1748066515-LPCLOUD',
          shortName: 'MOD13Q1',
          version: '061',
          title: 'MODIS/Terra Vegetation Indices 16-Day L3 Global 250m'
        }
      ]
    });

    try {
      const res = await request(app)
        .get('/api/integrations/satellite/search?shortName=MOD13Q1')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.collections[0].shortName, 'MOD13Q1');
    } finally {
      cmrClient.searchCollections = origSearch;
    }
  });

  test('POST /api/integrations/satellite/tasks rejects missing taskName with 400', async () => {
    const res = await request(app)
      .post('/api/integrations/satellite/tasks')
      .send({ taskType: 'point' })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_PARAMETERS');
  });

  test('POST /api/integrations/satellite/tasks submits task and returns 202', async () => {
    const origHasCreds = appeearsClient.hasCredentials;
    const origSubmit = appeearsClient.submitTask;

    appeearsClient.hasCredentials = () => true;
    appeearsClient.submitTask = async () => ({
      taskId: 'test-task-12345',
      status: 'pending',
      taskType: 'point',
      taskName: 'Burdwan_Test'
    });

    try {
      const res = await request(app)
        .post('/api/integrations/satellite/tasks')
        .send({
          taskName: 'Burdwan_Test',
          params: {
            dates: [{ startDate: '2026-05-01', endDate: '2026-05-16' }],
            layers: [{ product: 'MOD13Q1.061', layer: '_250m_16_days_NDVI' }]
          }
        })
        .expect(202);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.taskId, 'test-task-12345');
    } finally {
      appeearsClient.hasCredentials = origHasCreds;
      appeearsClient.submitTask = origSubmit;
    }
  });

  test('GET /api/integrations/satellite/tasks/:taskId returns 200 with processing status', async () => {
    const origStatus = appeearsClient.getTaskStatus;
    appeearsClient.getTaskStatus = async () => ({
      taskId: 'test-task-12345',
      status: 'processing',
      progress: 45
    });

    try {
      const res = await request(app)
        .get('/api/integrations/satellite/tasks/test-task-12345')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'processing');
      assert.equal(res.body.data.progress, 45);
    } finally {
      appeearsClient.getTaskStatus = origStatus;
    }
  });

  test('GET /api/integrations/satellite/tasks/:taskId/data returns 200 with bundle files', async () => {
    const origBundle = appeearsClient.getBundle;
    appeearsClient.getBundle = async () => ({
      taskId: 'test-task-12345',
      totalFiles: 1,
      files: [{ fileId: 'f1', fileName: 'MOD13Q1.csv', fileSize: 2048 }]
    });

    try {
      const res = await request(app)
        .get('/api/integrations/satellite/tasks/test-task-12345/data')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.totalFiles, 1);
    } finally {
      appeearsClient.getBundle = origBundle;
    }
  });
});
