import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ImdService, generateImdCacheKey } from '../src/integrations/imd/imd.service.js';
import { ApiCache } from '../src/models/ApiCache.js';
import { IMD_STATUS } from '../src/integrations/imd/imd.constants.js';

describe('Stage 5: IMD Cache Lifecycle & Invalidation Suite', () => {
  test('generateImdCacheKey produces deterministic, sorted cache keys', () => {
    const key1 = generateImdCacheKey('/current_wx', { stationId: '42809', district: 'Kolkata' });
    const key2 = generateImdCacheKey('/current_wx', { district: 'Kolkata', stationId: '42809' });
    assert.equal(key1, key2, 'Keys must be identical regardless of param order');
    assert.equal(key1, 'imd_current_wx_district=kolkata&stationid=42809');

    const keyDistrict = generateImdCacheKey('/districtrainfall', { district: 'Purba Bardhaman', date: '2026-11-15' });
    assert.equal(keyDistrict, 'imd_districtrainfall_date=2026-11-15&district=purba bardhaman');
  });

  test('Different endpoints, districts, or stations produce strictly distinct cache keys', () => {
    const keyWx = generateImdCacheKey('/current_wx', { stationId: '42809' });
    const keyAws = generateImdCacheKey('/aws_data', { stationId: '42809' });
    const keyDist1 = generateImdCacheKey('/districtrainfall', { district: 'Bankura' });
    const keyDist2 = generateImdCacheKey('/districtrainfall', { district: 'Birbhum' });

    assert.notEqual(keyWx, keyAws);
    assert.notEqual(keyDist1, keyDist2);
  });

  test('Cache workflow: first request is cache miss, second request is cache hit', async () => {
    let upstreamCallCount = 0;
    const mockClient = {
      hasCredentials: () => true,
      getCurrentWeather: async () => {
        upstreamCallCount++;
        return [
          {
            station_id: '42809',
            station_name: 'Kolkata (Alipore)',
            temp: 30.5,
            rh: 75,
            wind_speed: 3.5,
            rainfall: 0.0,
            observation_time: '2026-11-15 08:30:00'
          }
        ];
      }
    };

    const inMemoryCacheStore = new Map();
    const origFindOne = ApiCache.findOne;
    const origFindOneAndUpdate = ApiCache.findOneAndUpdate;

    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    ApiCache.findOne = async ({ source, cacheKey, expiresAt }) => {
      const entry = inMemoryCacheStore.get(cacheKey);
      if (entry && entry.expiresAt > new Date()) {
        return entry;
      }
      return null;
    };

    ApiCache.findOneAndUpdate = async ({ source, cacheKey }, update) => {
      const doc = {
        source,
        cacheKey,
        ...update.$set
      };
      inMemoryCacheStore.set(cacheKey, doc);
      return doc;
    };

    try {
      const service = new ImdService({ client: mockClient });

      // Request 1: Cache Miss -> Upstream call
      const res1 = await service.getCurrentWeather({ stationId: '42809' });
      assert.equal(res1.success, true);
      assert.equal(res1.fromCache, false);
      assert.equal(upstreamCallCount, 1);

      // Request 2: Cache Hit -> No upstream call
      const res2 = await service.getCurrentWeather({ stationId: '42809' });
      assert.equal(res2.success, true);
      assert.equal(res2.fromCache, true);
      assert.equal(res2.integrationStatus, IMD_STATUS.CACHE_HIT);
      assert.equal(upstreamCallCount, 1, 'Upstream must not be queried on cache hit');
    } finally {
      ApiCache.findOne = origFindOne;
      ApiCache.findOneAndUpdate = origFindOneAndUpdate;
      delete mongoose.connection.readyState;
    }
  });

  test('Expired cache entry triggers fresh upstream fetch', async () => {
    let upstreamCallCount = 0;
    const mockClient = {
      hasCredentials: () => true,
      getDistrictRainfall: async () => {
        upstreamCallCount++;
        return [
          {
            district: 'Bankura',
            actual: 5.0,
            normal: 4.5,
            departure: 11.1,
            category: 'NORMAL'
          }
        ];
      }
    };

    const inMemoryCacheStore = new Map();
    const origFindOne = ApiCache.findOne;
    const origFindOneAndUpdate = ApiCache.findOneAndUpdate;

    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    ApiCache.findOne = async ({ cacheKey, expiresAt }) => {
      const entry = inMemoryCacheStore.get(cacheKey);
      if (entry && entry.expiresAt > (expiresAt?.$gt || new Date())) {
        return entry;
      }
      return null;
    };

    ApiCache.findOneAndUpdate = async ({ cacheKey }, update) => {
      const doc = { cacheKey, ...update.$set };
      inMemoryCacheStore.set(cacheKey, doc);
      return doc;
    };

    try {
      const service = new ImdService({ client: mockClient });

      // 1. Initial fetch
      await service.getDistrictRainfall({ district: 'Bankura' });
      assert.equal(upstreamCallCount, 1);

      // 2. Manually expire cache entry
      const cacheKey = generateImdCacheKey('/districtrainfall', { district: 'bankura' });
      const cached = inMemoryCacheStore.get(cacheKey);
      assert.ok(cached, 'Cache document should exist');
      cached.expiresAt = new Date(Date.now() - 1000); // in the past

      // 3. Next query must refetch upstream
      const res = await service.getDistrictRainfall({ district: 'Bankura' });
      assert.equal(res.fromCache, false);
      assert.equal(upstreamCallCount, 2, 'Expired cache must trigger re-fetch');
    } finally {
      ApiCache.findOne = origFindOne;
      ApiCache.findOneAndUpdate = origFindOneAndUpdate;
      delete mongoose.connection.readyState;
    }
  });
});
