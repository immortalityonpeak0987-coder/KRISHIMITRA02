/**
 * MODIS Vegetation Products Helper
 * 
 * Product: MOD13Q1.061 (Terra MODIS Vegetation Indices 16-Day L3 Global 250m)
 * Scale factor: 0.0001, Valid Range: [-0.2, 1.0], Fill Value: -3000
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { NASA_SATELLITE_PRODUCTS } from './satelliteConfig.js';

export class ModisClient {
  constructor() {
    this.spec = NASA_SATELLITE_PRODUCTS.MODIS_NDVI;
  }

  /**
   * Decodes raw integer NDVI values using official scale factor (0.0001)
   * 
   * @param {number|null} rawVal Raw integer NDVI (e.g. 7200)
   * @returns {{ rawVal: number|null, scaledVal: number|null, unit: string, qualityFlag: string }}
   */
  decodeNdviValue(rawVal) {
    if (rawVal === null || rawVal === undefined) {
      return { rawVal: null, scaledVal: null, unit: 'index', qualityFlag: 'MISSING' };
    }

    const num = Number(rawVal);
    if (isNaN(num) || num === this.spec.fillValue) {
      return { rawVal: num, scaledVal: null, unit: 'index', qualityFlag: 'MISSING' };
    }

    const scaled = Number((num * this.spec.scaleFactor).toFixed(4));

    let qualityFlag = 'NOMINAL';
    if (scaled < this.spec.validRange.scaledMin || scaled > this.spec.validRange.scaledMax) {
      qualityFlag = 'SUSPECT';
    }

    return {
      rawVal: num,
      scaledVal: scaled,
      unit: 'index',
      qualityFlag
    };
  }

  /**
   * Decodes MODIS 16-day VI Quality bitmask (_250m_16_days_VI_Quality)
   * 
   * @param {number} qualityBitmask 16-bit integer
   * @returns {object}
   */
  decodeViQuality(qualityBitmask) {
    if (qualityBitmask === null || qualityBitmask === undefined || isNaN(Number(qualityBitmask))) {
      return { qualityAssessment: 'UNKNOWN', modlandQa: 'MISSING', cloudState: 'UNKNOWN' };
    }

    const val = parseInt(qualityBitmask, 10);
    const modlandBits = val & 0b11; // bits 0-1
    let modlandQa = 'GOOD_DATA';
    if (modlandBits === 1) modlandQa = 'MARGINAL_DATA';
    else if (modlandBits === 2) modlandQa = 'SNOW_ICE';
    else if (modlandBits === 3) modlandQa = 'CLOUDY_OR_MISSING';

    const aerosolBits = (val >> 6) & 0b11; // bits 6-7
    let aerosolQuantity = 'CLIMATOLOGY';
    if (aerosolBits === 1) aerosolQuantity = 'LOW';
    else if (aerosolBits === 2) aerosolQuantity = 'INTERMEDIATE';
    else if (aerosolBits === 3) aerosolQuantity = 'HIGH';

    return {
      qualityAssessment: modlandBits === 0 ? 'HIGH' : (modlandBits === 1 ? 'MODERATE' : 'POOR'),
      modlandQa,
      aerosolQuantity
    };
  }
}

export const modisClient = new ModisClient();
export default modisClient;
