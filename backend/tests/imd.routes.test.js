import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { imdClient } from '../src/integrations/imd/imd.client.js';

describe('Stage 5: IMD Routes & Dual-Mount Endpoint Suite', () => {
  const app = createApp();

  test('GET /api/integrations/imd/status returns 200 with operational metadata and stations', async () => {
    const res = await request(app)
      .get('/api/integrations/imd/status')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.provider, 'IMD');
    assert.ok(res.body.data.status);
    assert.ok(res.body.data.endpoints.current_wx);
    assert.ok(res.body.data.endpoints.districtrainfall);
    assert.ok(res.body.data.endpoints.staterainfall);
    assert.ok(res.body.data.endpoints.aws_data);
    assert.ok(res.body.data.sampleStations['42809']);
    assert.match(res.body.data.disclaimer, /OBSERVED/);
  });

  test('GET /api/v1/integrations/imd/status returns equivalent response (Dual-Mount Compatibility)', async () => {
    const res = await request(app)
      .get('/api/v1/integrations/imd/status')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.provider, 'IMD');
    assert.equal(res.body.data.supportedStations, 14);
  });

  test('GET /api/integrations/imd/current_wx returns 200 with mock client', async () => {
    const origFetch = imdClient.fetchCurrentWeather;
    imdClient.fetchCurrentWeather = async () => [
      {
        station_id: '42809',
        station_name: 'Kolkata (Alipore)',
        temp: 31.0,
        rh: 70,
        wind_speed: 4.0,
        rainfall: 0.0,
        observation_time: '2026-11-15 08:30:00'
      }
    ];

    try {
      const res = await request(app)
        .get('/api/integrations/imd/current_wx?stationId=42809')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.meta.provider, 'IMD');
      assert.equal(res.body.meta.endpoint, '/current_wx');
      assert.ok(res.body.data.observations.length > 0);
    } finally {
      imdClient.fetchCurrentWeather = origFetch;
    }
  });

  test('GET /api/v1/integrations/imd/current-weather alias returns equivalent 200', async () => {
    const origFetch = imdClient.fetchCurrentWeather;
    imdClient.fetchCurrentWeather = async () => [
      {
        station_id: '42809',
        station_name: 'Kolkata (Alipore)',
        temp: 31.0,
        rh: 70,
        wind_speed: 4.0,
        rainfall: 0.0
      }
    ];

    try {
      const res = await request(app)
        .get('/api/v1/integrations/imd/current-weather?stationId=42809')
        .expect(200);

      assert.equal(res.body.success, true);
    } finally {
      imdClient.fetchCurrentWeather = origFetch;
    }
  });

  test('GET /api/integrations/imd/current_wx rejects invalid station ID format with 400', async () => {
    const res = await request(app)
      .get('/api/integrations/imd/current_wx?stationId=invalid_station_code_1234567')
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid|unsupported/i);
  });

  test('GET /api/integrations/imd/districtrainfall returns 200 on valid West Bengal district', async () => {
    const origFetch = imdClient.fetchDistrictRainfall;
    imdClient.fetchDistrictRainfall = async () => [
      {
        district: 'Bankura',
        actual: 8.5,
        normal: 7.2,
        departure: 18.0,
        category: 'NORMAL'
      }
    ];

    try {
      const res = await request(app)
        .get('/api/integrations/imd/districtrainfall?district=Bankura')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.meta.endpoint, '/districtrainfall');
      assert.equal(res.body.data.records[0].district, 'Bankura');
    } finally {
      imdClient.fetchDistrictRainfall = origFetch;
    }
  });

  test('GET /api/v1/integrations/imd/district-rainfall alias returns equivalent 200', async () => {
    const origFetch = imdClient.fetchDistrictRainfall;
    imdClient.fetchDistrictRainfall = async () => [
      { district: 'Bankura', actual: 8.5, normal: 7.2 }
    ];

    try {
      const res = await request(app)
        .get('/api/v1/integrations/imd/district-rainfall?district=Bankura')
        .expect(200);

      assert.equal(res.body.success, true);
    } finally {
      imdClient.fetchDistrictRainfall = origFetch;
    }
  });

  test('GET /api/integrations/imd/districtrainfall rejects non-West Bengal district with 400', async () => {
    const res = await request(app)
      .get('/api/integrations/imd/districtrainfall?district=Patna')
      .expect(400);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNSUPPORTED_DISTRICT');
  });

  test('GET /api/integrations/imd/staterainfall and /state-rainfall return 200', async () => {
    const origFetch = imdClient.fetchStateRainfall;
    imdClient.fetchStateRainfall = async () => ({
      state: 'West Bengal',
      actual: 10.2,
      normal: 9.8,
      departure: 4.1,
      category: 'NORMAL'
    });

    try {
      const res1 = await request(app)
        .get('/api/integrations/imd/staterainfall')
        .expect(200);
      assert.equal(res1.body.success, true);

      const res2 = await request(app)
        .get('/api/v1/integrations/imd/state-rainfall')
        .expect(200);
      assert.equal(res2.body.success, true);
    } finally {
      imdClient.fetchStateRainfall = origFetch;
    }
  });

  test('GET /api/integrations/imd/aws_data and /aws return 200', async () => {
    const origFetch = imdClient.fetchAwsData;
    imdClient.fetchAwsData = async () => [
      {
        station_id: 'AWS_CANNING_01',
        temp: 28.5,
        rh: 80,
        rainfall: 0.0,
        wind_speed: 3.2
      }
    ];

    try {
      const res1 = await request(app)
        .get('/api/integrations/imd/aws_data')
        .expect(200);
      assert.equal(res1.body.success, true);

      const res2 = await request(app)
        .get('/api/v1/integrations/imd/aws')
        .expect(200);
      assert.equal(res2.body.success, true);
    } finally {
      imdClient.fetchAwsData = origFetch;
    }
  });

  test('Rejects invalid farmId with 400 on all endpoints', async () => {
    const res = await request(app)
      .get('/api/integrations/imd/current_wx?farmId=not-a-valid-id')
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid/i);
  });
});
