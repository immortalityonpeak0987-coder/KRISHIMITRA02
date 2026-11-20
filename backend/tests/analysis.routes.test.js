import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Cross-Cutting: Analysis, Risk, Crop, and Report Routes Suite', () => {
  const app = createApp();
  const demoFarmId = 'farm-bardhaman-01';

  test('GET /api/analyses/:farmId/climate returns 200 with snapshot data', async () => {
    const res = await request(app)
      .get(`/api/analyses/${demoFarmId}/climate`)
      .expect(200);

    assert.equal(res.body.status, 'success');
    assert.ok(res.body.data.currentSnapshot);
    assert.ok(res.body.metadata.source.includes('NASA'));
  });

  test('GET /api/v1/analyses/:farmId/climate returns equivalent response (Dual-Mount Parity)', async () => {
    const res = await request(app)
      .get(`/api/v1/analyses/${demoFarmId}/climate`)
      .expect(200);

    assert.equal(res.body.status, 'success');
    assert.ok(res.body.data.currentSnapshot);
  });

  test('GET /api/analyses/:farmId/environment returns 200 with standardized observations', async () => {
    const res = await request(app)
      .get(`/api/analyses/${demoFarmId}/environment`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.spatialAssessments);
    assert.ok(res.body.data.aggregated);
  });

  test('GET /api/analyses/:farmId/risks matches frontend contract and returns 200', async () => {
    const res = await request(app)
      .get(`/api/analyses/${demoFarmId}/risks`)
      .expect(200);

    assert.equal(res.body.status, 'success');
    assert.ok(res.body.data.overallRiskLevel);
    assert.ok(Array.isArray(res.body.data.riskFactors));
    assert.equal(res.body.data.riskFactors.length, 5);
  });

  test('GET /api/v1/analyses/:farmId/risks returns equivalent response (Dual-Mount Parity)', async () => {
    const res = await request(app)
      .get(`/api/v1/analyses/${demoFarmId}/risks`)
      .expect(200);

    assert.equal(res.body.status, 'success');
    assert.ok(res.body.data.overallRiskLevel);
  });

  test('GET /api/analyses/:farmId/rotation returns 200 with rotation sequence', async () => {
    const res = await request(app)
      .get(`/api/analyses/${demoFarmId}/rotation`)
      .expect(200);

    assert.equal(res.body.status, 'success');
    assert.ok(Array.isArray(res.body.data.recommendedSequence));
    assert.ok(Array.isArray(res.body.metadata.rulesChecked));
  });

  test('POST /api/analyses/:farmId/simulate returns 200 with what-if scenario assessment', async () => {
    const res = await request(app)
      .post(`/api/analyses/${demoFarmId}/simulate`)
      .send({ tempOffsetCelsius: 1.5, rainfallOffsetPercent: -25, sowingDelayDays: 12 })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.vulnerabilityIndex > 0);
    assert.ok(res.body.data.suggestedAdjustment);
  });

  test('GET /api/crops returns 200 with research-verified West Bengal catalog', async () => {
    const res = await request(app)
      .get('/api/crops')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.count >= 5);
  });

  test('POST /api/reports/generate creates report and returns 201 with downloadUrl', async () => {
    const res = await request(app)
      .post('/api/reports/generate')
      .send({ farmId: demoFarmId, format: 'PDF' })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.reportId);
    assert.ok(res.body.data.downloadUrl);

    // Test download
    const dlRes = await request(app)
      .get(res.body.data.downloadUrl)
      .expect(200);

    assert.equal(dlRes.headers['content-type'], 'application/pdf');
    assert.ok(dlRes.body.length > 500);
  });

  test('GET /api/farms returns 200 with list of farms', async () => {
    const res = await request(app)
      .get('/api/farms')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 3);
  });

  test('POST /api/farms/:farmId/observations logs farmer field update with 201', async () => {
    const res = await request(app)
      .post(`/api/farms/${demoFarmId}/observations`)
      .send({ title: 'Bund Check', description: 'Repaired southern secondary bund after rain.' })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.title, 'Bund Check');
  });
});
