import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { cmrClient } from '../src/integrations/satellite/cmrClient.js';

describe('NASA CMR Dedicated Routes Suite (/api and /api/v1)', () => {
  let app;

  before(() => {
    app = createApp();
  });

  it('GET /api/integrations/cmr/status returns 200 with metadata discovery capabilities', async () => {
    const res = await request(app)
      .get('/api/integrations/cmr/status')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.provider, 'NASA CMR');
    assert.strictEqual(res.body.data.authRequired, false);
    assert.strictEqual(res.body.data.serviceType, 'METADATA_DISCOVERY_SERVICE');
  });

  it('GET /api/v1/integrations/cmr/status returns 200 (Dual-Mount Parity)', async () => {
    const res = await request(app)
      .get('/api/v1/integrations/cmr/status')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.provider, 'NASA CMR');
  });

  it('GET /api/integrations/cmr/collections searches collections and returns 200', async () => {
    const origSearch = cmrClient.searchCollections;
    cmrClient.searchCollections = async () => ({
      total: 1,
      collections: [{
        id: 'C123456-LPDAAC_ECS',
        title: 'MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061',
        shortName: 'MOD13Q1',
        version: '061',
        summary: 'NDVI and EVI 250m data product'
      }]
    });

    try {
      const res = await request(app)
        .get('/api/integrations/cmr/collections?shortName=MOD13Q1')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.total, 1);
      assert.strictEqual(res.body.data.collections[0].shortName, 'MOD13Q1');
    } finally {
      cmrClient.searchCollections = origSearch;
    }
  });

  it('GET /api/v1/integrations/cmr/collections returns 200 (Dual-Mount Parity)', async () => {
    const origSearch = cmrClient.searchCollections;
    cmrClient.searchCollections = async () => ({
      total: 1,
      collections: [{
        id: 'C123456-LPDAAC_ECS',
        title: 'MOD13Q1 Test',
        shortName: 'MOD13Q1',
        version: '061'
      }]
    });

    try {
      const res = await request(app)
        .get('/api/v1/integrations/cmr/collections?shortName=MOD13Q1')
        .expect(200);

      assert.strictEqual(res.body.success, true);
    } finally {
      cmrClient.searchCollections = origSearch;
    }
  });

  it('GET /api/integrations/cmr/granules searches observation granules and returns 200', async () => {
    const origGranules = cmrClient.searchGranules;
    cmrClient.searchGranules = async () => ({
      total: 1,
      granules: [{
        id: 'G123456-LPDAAC',
        title: 'MOD13Q1.A2024129.h26v06.061.2024146030948.hdf',
        datasetId: 'MOD13Q1',
        granuleSizeMB: 45.2,
        downloadUrls: ['https://data.lpdaac.earthdatacloud.nasa.gov/MOD13Q1.hdf']
      }]
    });

    try {
      const res = await request(app)
        .get('/api/integrations/cmr/granules?shortName=MOD13Q1')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.total, 1);
      assert.strictEqual(res.body.data.granules[0].granuleSizeMB, 45.2);
    } finally {
      cmrClient.searchGranules = origGranules;
    }
  });
});
