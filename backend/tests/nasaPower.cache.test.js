import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  NasaPowerService,
  generateCacheKey
} from '../src/integrations/nasaPower/nasaPower.service.js';
import { ApiCache } from '../src/models/ApiCache.js';
import { INTEGRATION_STATUS } from '../src/integrations/nasaPower/nasaPower.constants.js';

describe('Stage 4: NASA POWER Cache Lifecycle & Invalidation Suite', () => {
  test('Different coordinates, dates, or parameter lists produce strictly unique cache keys', () => {
    const base = {
      latitude: 23.2324,
      longitude: 88.3639,
      start: '20240501',
      end: '20240503',
      parameters: ['T2M', 'PRECTOTCORR']
    };

    const baseKey = generateCacheKey(base);

    // 1. Different latitude
    const diffLatKey = generateCacheKey({ ...base, latitude: 23.2325 });
    assert.notEqual(baseKey, diffLatKey, 'Different latitude must produce different cache key');

    // 2. Different longitude
    const diffLonKey = generateCacheKey({ ...base, longitude: 88.3640 });
    assert.notEqual(baseKey, diffLonKey, 'Different longitude must produce different cache key');

    // 3. Different start date
    const diffStartKey = generateCacheKey({ ...base, start: '20240502' });
    assert.notEqual(baseKey, diffStartKey, 'Different start date must produce different cache key');

    // 4. Different end date
    const diffEndKey = generateCacheKey({ ...base, end: '20240504' });
    assert.notEqual(baseKey, diffEndKey, 'Different end date must produce different cache key');

    // 5. Different parameter list
    const diffParamKey = generateCacheKey({ ...base, parameters: ['T2M', 'PRECTOTCORR', 'WS2M'] });
    assert.notEqual(baseKey, diffParamKey, 'Different parameter list must produce different cache key');

    // 6. Same parameters in different order MUST produce the exact same key (deterministic sorting)
    const reversedParamKey = generateCacheKey({ ...base, parameters: ['PRECTOTCORR', 'T2M'] });
    assert.equal(baseKey, reversedParamKey, 'Parameter order must not affect deterministic cache key');
  });

  test('Cache workflow: first request produces cache miss, second request produces cache hit', async () => {
    // In-memory cache store to simulate MongoDB ApiCache collection
    const inMemoryDb = new Map();
    let upstreamCallCount = 0;

    const mockClient = {
      fetchDailyPointData: async ({ latitude, longitude, start, end, parameters }) => {
        upstreamCallCount++;
        return {
          type: 'Feature',
          geometry: { coordinates: [longitude, latitude, 10.0] },
          properties: {
            parameter: {
              T2M: { '20240501': 32.5 }
            }
          }
        };
      }
    };

    // Temporarily mock ApiCache methods and mongoose.connection.readyState
    const originalReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    const originalFindOne = ApiCache.findOne;
    const originalFindOneAndUpdate = ApiCache.findOneAndUpdate;

    ApiCache.findOne = (query) => ({
      lean: async () => {
        const item = inMemoryDb.get(query.cacheKey);
        if (!item) return null;
        // Evaluate expiresAt condition
        if (query.expiresAt && query.expiresAt.$gt) {
          if (item.expiresAt <= query.expiresAt.$gt) {
            return null; // Expired
          }
        }
        if (query.status && item.status !== query.status) return null;
        return item;
      }
    });

    ApiCache.findOneAndUpdate = async (filter, update) => {
      const doc = {
        cacheKey: filter.cacheKey,
        ...update.$set,
        fetchedAt: update.$set.fetchedAt || new Date(),
        expiresAt: update.$set.expiresAt,
        status: update.$set.status || 'VALID'
      };
      inMemoryDb.set(filter.cacheKey, doc);
      return doc;
    };

    try {
      const service = new NasaPowerService({ client: mockClient, cacheTtlMs: 3600000 });

      // Request 1: Cache Miss
      const res1 = await service.getPointData({
        latitude: 23.2324,
        longitude: 88.3639,
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        parameters: ['T2M']
      });

      assert.equal(res1.success, true);
      assert.equal(res1.cached, true, 'Result was saved to cache');
      assert.equal(res1.integrationStatus, INTEGRATION_STATUS.SUCCESS);
      assert.equal(upstreamCallCount, 1, 'Upstream NASA POWER API must be called on cache miss');
      assert.equal(inMemoryDb.size, 1, 'One document must be stored in cache');

      // Request 2: Identical query -> Cache Hit
      const res2 = await service.getPointData({
        latitude: 23.2324,
        longitude: 88.3639,
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        parameters: ['T2M']
      });

      assert.equal(res2.success, true);
      assert.equal(res2.cached, true);
      assert.equal(res2.integrationStatus, INTEGRATION_STATUS.CACHE_HIT, 'Must report CACHE_HIT status');
      assert.equal(upstreamCallCount, 1, 'Upstream NASA POWER API must NOT be called on cache hit');
    } finally {
      // Restore originals
      ApiCache.findOne = originalFindOne;
      ApiCache.findOneAndUpdate = originalFindOneAndUpdate;
      if (originalReadyState) {
        Object.defineProperty(mongoose.connection, 'readyState', originalReadyState);
      }
    }
  });

  test('Expired cache entry is not returned as fresh and triggers fresh upstream fetch', async () => {
    let upstreamCallCount = 0;
    const mockClient = {
      fetchDailyPointData: async ({ latitude, longitude, start, end, parameters }) => {
        upstreamCallCount++;
        return {
          type: 'Feature',
          geometry: { coordinates: [longitude, latitude, 10.0] },
          properties: {
            parameter: {
              T2M: { '20240501': 33.1 }
            }
          }
        };
      }
    };

    const originalReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    const originalFindOne = ApiCache.findOne;
    const originalFindOneAndUpdate = ApiCache.findOneAndUpdate;

    // Simulate an already-expired cache entry
    const expiredEntry = {
      cacheKey: 'nasa_power_daily_23.2324_88.3639_20240501_20240501_T2M',
      source: 'NASA_POWER',
      responseData: { status: 'SUCCESS' },
      fetchedAt: new Date(Date.now() - 1000000),
      expiresAt: new Date(Date.now() - 500000), // In the past!
      status: 'VALID'
    };

    ApiCache.findOne = (query) => ({
      lean: async () => {
        // Enforce expiresAt > query.expiresAt.$gt
        if (query.expiresAt?.$gt && expiredEntry.expiresAt <= query.expiresAt.$gt) {
          return null; // Expired, so query returns null
        }
        return expiredEntry;
      }
    });

    let updatedWithNewExpiry = false;
    ApiCache.findOneAndUpdate = async (filter, update) => {
      if (update.$set.expiresAt > new Date()) {
        updatedWithNewExpiry = true;
      }
      return update.$set;
    };

    try {
      const service = new NasaPowerService({ client: mockClient });

      const res = await service.getPointData({
        latitude: 23.2324,
        longitude: 88.3639,
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        parameters: ['T2M']
      });

      assert.equal(res.success, true);
      assert.equal(res.integrationStatus, INTEGRATION_STATUS.SUCCESS, 'Expired cache must trigger fresh fetch, not CACHE_HIT');
      assert.equal(upstreamCallCount, 1, 'Must query upstream when cache is expired');
      assert.equal(updatedWithNewExpiry, true, 'Cache must be updated with fresh expiration date');
    } finally {
      ApiCache.findOne = originalFindOne;
      ApiCache.findOneAndUpdate = originalFindOneAndUpdate;
      if (originalReadyState) {
        Object.defineProperty(mongoose.connection, 'readyState', originalReadyState);
      }
    }
  });
});
