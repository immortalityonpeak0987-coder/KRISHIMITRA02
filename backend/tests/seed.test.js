import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { runSeed } from '../src/seed/seed.js';
import { cleanDemoData } from '../src/seed/clean.js';
import { config } from '../src/config/env.js';

describe('Stage 3: Seed & Cleanup Safety Suite', () => {

  test('runSeed strictly refuses execution in production mode', async () => {
    const savedProd = config.isProduction;
    try {
      config.isProduction = true;

      await assert.rejects(async () => {
        await runSeed({ silent: true });
      }, /Seeding demonstration records is strictly prohibited in production mode/);
    } finally {
      config.isProduction = savedProd;
    }
  });

  test('cleanDemoData strictly refuses execution in production mode', async () => {
    const savedProd = config.isProduction;
    try {
      config.isProduction = true;

      await assert.rejects(async () => {
        await cleanDemoData({ silent: true });
      }, /Cleaning demonstration records is prohibited in production mode/);
    } finally {
      config.isProduction = savedProd;
    }
  });

});
