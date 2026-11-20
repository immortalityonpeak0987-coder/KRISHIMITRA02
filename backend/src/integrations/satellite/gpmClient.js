/**
 * GPM IMERG Precipitation Helper
 * 
 * Products:
 * - GPM_3IMERGDL.07: IMERG Late Run Daily (~14h latency, climatologically calibrated)
 * - GPM_3IMERGDF.07: IMERG Final Run Daily (~3.5 months latency, monthly GPCC gauge adjusted)
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { NASA_SATELLITE_PRODUCTS } from './satelliteConfig.js';

export class GpmClient {
  constructor() {
    this.specLate = NASA_SATELLITE_PRODUCTS.GPM_IMERG_LATE;
    this.specFinal = NASA_SATELLITE_PRODUCTS.GPM_IMERG_FINAL;
  }

  /**
   * Decodes GPM IMERG precipitation readings preserving genuine zeros
   * 
   * @param {number|null} rawVal
   * @param {'LATE'|'FINAL'} [runType='LATE']
   * @returns {{ rawVal: number|null, scaledVal: number|null, unit: string, runType: string, qualityFlag: string }}
   */
  decodePrecipitationValue(rawVal, runType = 'LATE') {
    if (rawVal === null || rawVal === undefined) {
      return { rawVal: null, scaledVal: null, unit: 'mm/day', runType, qualityFlag: 'MISSING' };
    }

    const num = Number(rawVal);
    if (isNaN(num) || num <= -9990.0) {
      return { rawVal: num, scaledVal: null, unit: 'mm/day', runType, qualityFlag: 'MISSING' };
    }

    const isZero = num === 0;

    return {
      rawVal: num,
      scaledVal: Number(num.toFixed(2)),
      unit: 'mm/day',
      runType,
      isZeroRainfall: isZero,
      qualityFlag: 'NOMINAL'
    };
  }

  getRunSpecifications() {
    return {
      late: {
        product: this.specLate.fullIdentifier,
        runType: 'LATE',
        latency: '~14 hours',
        gaugeCalibrated: false,
        climatologicalAdjustment: true,
        useCase: 'Ongoing agricultural monitoring and operational waterlogging screening'
      },
      final: {
        product: this.specFinal.fullIdentifier,
        runType: 'FINAL',
        latency: '~3.5 months',
        gaugeCalibrated: true,
        gaugeSource: 'GPCC (Global Precipitation Climatology Centre)',
        useCase: 'Retrospective climate analysis and research-grade seasonal benchmarks'
      }
    };
  }
}

export const gpmClient = new GpmClient();
export default gpmClient;
