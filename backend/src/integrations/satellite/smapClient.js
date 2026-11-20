/**
 * SMAP Soil Moisture Products Helper
 * 
 * Products:
 * - SPL3SMP_E.006: Enhanced L3 9km Daily Surface Soil Moisture (top 5 cm)
 * - SPL4SMAU.008: L4 9km 3-hourly Surface (0-5cm) and Root-Zone (0-100cm) Analysis Update
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { NASA_SATELLITE_PRODUCTS } from './satelliteConfig.js';

export class SmapClient {
  constructor() {
    this.specL3 = NASA_SATELLITE_PRODUCTS.SMAP_SOIL_MOISTURE_L3;
    this.specL4 = NASA_SATELLITE_PRODUCTS.SMAP_SOIL_MOISTURE_L4;
  }

  /**
   * Decodes SMAP volumetric soil moisture readings
   * 
   * @param {number|null} rawVal
   * @param {'SURFACE'|'ROOT_ZONE'} [depthCategory='SURFACE']
   * @returns {{ rawVal: number|null, scaledVal: number|null, unit: string, depthCategory: string, qualityFlag: string }}
   */
  decodeSoilMoistureValue(rawVal, depthCategory = 'SURFACE') {
    if (rawVal === null || rawVal === undefined) {
      return { rawVal: null, scaledVal: null, unit: 'cm³/cm³', depthCategory, qualityFlag: 'MISSING' };
    }

    const num = Number(rawVal);
    if (isNaN(num) || num <= -9990.0) {
      return { rawVal: num, scaledVal: null, unit: 'cm³/cm³', depthCategory, qualityFlag: 'MISSING' };
    }

    let qualityFlag = 'NOMINAL';
    if (num < 0.0 || num > 0.9) {
      qualityFlag = 'SUSPECT';
    }

    return {
      rawVal: num,
      scaledVal: Number(num.toFixed(4)),
      unit: 'cm³/cm³',
      depthCategory: depthCategory === 'ROOT_ZONE' ? 'ROOT_ZONE (0-100 cm)' : 'SURFACE (0-5 cm)',
      qualityFlag
    };
  }

  getDepthSpecifications() {
    return {
      surfaceL3: {
        product: this.specL3.fullIdentifier,
        depth: '0-5 cm',
        spatialResolution: '9 km',
        scientificNote: 'Measures top 5 cm dielectric constant. Does not measure entire crop root zone.'
      },
      rootZoneL4: {
        product: this.specL4.fullIdentifier,
        surfaceDepth: '0-5 cm',
        rootZoneDepth: '0-100 cm',
        spatialResolution: '9 km',
        scientificNote: 'Model assimilation product integrating surface brightness temperatures with catchment hydrology.'
      }
    };
  }
}

export const smapClient = new SmapClient();
export default smapClient;
