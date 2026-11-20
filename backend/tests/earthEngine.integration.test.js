import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { EarthEngineClient, EarthEngineUpstreamError } from '../src/integrations/earthEngine/earthEngine.client.js';
import { EarthEngineService } from '../src/integrations/earthEngine/earthEngine.service.js';
import { EARTH_ENGINE_STATUS } from '../src/integrations/earthEngine/earthEngine.constants.js';

describe('Google Earth Engine REST API Integration Suite', () => {
  let app;

  before(() => {
    app = createApp();
  });

  describe('EarthEngineClient Unit Tests', () => {
    it('Reports PROJECT_CONFIGURATION_REQUIRED when project ID is missing', () => {
      const client = new EarthEngineClient({ projectId: '', keyFilePath: '' });
      const auth = client.getAuthStatus();
      assert.strictEqual(auth.configured, false);
      assert.strictEqual(auth.status, EARTH_ENGINE_STATUS.PROJECT_CONFIGURATION_REQUIRED);
    });

    it('Reports AUTH_REQUIRED when project ID is present but credentials path is missing', () => {
      const client = new EarthEngineClient({ projectId: 'krishi-mitra-test-project', keyFilePath: '' });
      const auth = client.getAuthStatus();
      assert.strictEqual(auth.configured, false);
      assert.strictEqual(auth.status, EARTH_ENGINE_STATUS.AUTH_REQUIRED);
    });

    it('Reports AVAILABLE when both project ID and credentials path are configured', () => {
      const client = new EarthEngineClient({
        projectId: 'krishi-mitra-test-project',
        keyFilePath: '/path/to/valid-key.json'
      });
      const auth = client.getAuthStatus();
      assert.strictEqual(auth.configured, true);
      assert.strictEqual(auth.status, EARTH_ENGINE_STATUS.AVAILABLE);
    });

    it('Enforces SSRF protection on discovery URL', async () => {
      const client = new EarthEngineClient({
        discoveryUrl: 'https://malicious-external-site.com/discovery'
      });
      await assert.rejects(
        () => client.fetchDiscoveryDocument(),
        (err) => {
          assert.strictEqual(err.name, 'EarthEngineUpstreamError');
          assert.strictEqual(err.statusCode, 400);
          assert.match(err.message, /SSRF protection/);
          return true;
        }
      );
    });

    it('Rejects listProjectAssets with 412 when project configuration is missing', async () => {
      const client = new EarthEngineClient({ projectId: '', keyFilePath: '' });
      await assert.rejects(
        () => client.listProjectAssets(),
        (err) => {
          assert.strictEqual(err.statusCode, 412);
          assert.strictEqual(err.integrationStatus, EARTH_ENGINE_STATUS.PROJECT_CONFIGURATION_REQUIRED);
          return true;
        }
      );
    });

    it('Fetches and parses discovery document using mock HTTP client', async () => {
      const mockDiscoveryData = {
        id: 'earthengine:v1',
        title: 'Google Earth Engine API',
        version: 'v1',
        discoveryVersion: 'v1',
        baseUrl: 'https://earthengine.googleapis.com/v1/',
        auth: {
          oauth2: {
            scopes: {
              'https://www.googleapis.com/auth/earthengine': {},
              'https://www.googleapis.com/auth/cloud-platform': {}
            }
          }
        },
        resources: {
          projects: {
            methods: {},
            resources: {
              assets: {},
              image: {}
            }
          }
        }
      };

      const mockHttpClient = {
        get: async (url) => ({ status: 200, data: mockDiscoveryData })
      };

      const client = new EarthEngineClient({ httpClient: mockHttpClient });
      const doc = await client.fetchDiscoveryDocument();
      assert.strictEqual(doc.id, 'earthengine:v1');
      assert.strictEqual(doc.title, 'Google Earth Engine API');
    });
  });

  describe('EarthEngineService Tests', () => {
    it('getStatus returns complete operational metadata and disclaimers', () => {
      const service = new EarthEngineService();
      const status = service.getStatus();
      assert.strictEqual(status.provider, 'Google Earth Engine');
      assert.strictEqual(status.serviceType, 'GEOSPATIAL_ANALYSIS_API');
      assert.ok(status.status);
      assert.ok(status.capabilities.discoveryDocumentAccess);
      assert.ok(status.pilotGeographyCoverage.primaryDistricts.includes('Purba Bardhaman'));
      assert.ok(status.disclaimer.includes('planetary-scale'));
    });

    it('getConfig returns detailed credentials spec and step-by-step setup instructions', () => {
      const service = new EarthEngineService();
      const configData = service.getConfig();
      assert.strictEqual(configData.provider, 'Google Earth Engine');
      assert.ok(Array.isArray(configData.requiredCredentialsSpec.scopes));
      assert.ok(Array.isArray(configData.setupInstructions));
      assert.ok(configData.setupInstructions.length >= 4);
    });

    it('getDiscovery summarizes discovery document correctly', async () => {
      const mockHttpClient = {
        get: async () => ({
          status: 200,
          data: {
            id: 'earthengine:v1',
            title: 'Google Earth Engine API',
            version: 'v1',
            auth: { oauth2: { scopes: { 'https://www.googleapis.com/auth/earthengine': {} } } },
            resources: { projects: {} }
          }
        })
      };

      const client = new EarthEngineClient({ httpClient: mockHttpClient });
      const service = new EarthEngineService(client);
      const res = await service.getDiscovery({ forceRefresh: true });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data.id, 'earthengine:v1');
      assert.ok(res.data.authScopes.includes('https://www.googleapis.com/auth/earthengine'));
      assert.ok(res.data.resources.includes('projects'));
    });
  });

  describe('Dual-Mount Endpoints Parity (/api and /api/v1)', () => {
    it('GET /api/integrations/earth-engine/status returns 200', async () => {
      const res = await request(app)
        .get('/api/integrations/earth-engine/status')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.provider, 'Google Earth Engine');
    });

    it('GET /api/v1/integrations/earth-engine/status returns 200 (Dual-Mount Parity)', async () => {
      const res = await request(app)
        .get('/api/v1/integrations/earth-engine/status')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.provider, 'Google Earth Engine');
    });

    it('GET /api/integrations/earth-engine/config returns 200 with setup instructions', async () => {
      const res = await request(app)
        .get('/api/integrations/earth-engine/config')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.setupInstructions.length > 0);
    });

    it('GET /api/v1/integrations/earth-engine/config returns 200 (Dual-Mount Parity)', async () => {
      const res = await request(app)
        .get('/api/v1/integrations/earth-engine/config')
        .expect(200);

      assert.strictEqual(res.body.success, true);
    });

    it('GET /api/integrations/earth-engine/discovery returns 200 schema or handles upstream safely', async () => {
      const res = await request(app)
        .get('/api/integrations/earth-engine/discovery');

      // In live environment, reaches upstream or cached discovery doc (200)
      // In completely offline environment, returns 502/503 gracefully with JSON error
      assert.ok([200, 502, 503].includes(res.status));
      if (res.status === 200) {
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.title.includes('Earth Engine'));
      }
    });
  });
});
