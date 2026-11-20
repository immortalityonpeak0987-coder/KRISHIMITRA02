/**
 * Environmental Quality & Spatial Limitation Assessment Service
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { QUALITY_STATES, PHYSICAL_RANGES } from './environmentalConstants.js';

export class EnvironmentalQualityService {
  static evaluateObservation(obs) {
    if (!obs) {
      return { qualityState: QUALITY_STATES.INVALID, description: 'Null or undefined observation' };
    }

    if (obs.standardizedValue === null || obs.standardizedValue === undefined) {
      return {
        qualityState: QUALITY_STATES.MISSING,
        description: 'Observation value is null/missing.'
      };
    }

    const range = PHYSICAL_RANGES[obs.parameter];
    if (range) {
      if (obs.standardizedValue < range.min || obs.standardizedValue > range.max) {
        return {
          qualityState: QUALITY_STATES.OUT_OF_RANGE,
          description: `Value ${obs.standardizedValue} exceeds physical range [${range.min}, ${range.max}].`
        };
      }
    }

    return {
      qualityState: obs.qualityState || QUALITY_STATES.VALID,
      description: obs.qualityDescription || 'Observation verified.'
    };
  }

  static assessSpatialFootprint(farmAreaHa, spatialResolutionStr) {
    let footprintHa = 1.0;
    const res = String(spatialResolutionStr || '').toLowerCase();

    if (res.includes('10km') || res.includes('0.1')) {
      footprintHa = 10000;
    } else if (res.includes('9km')) {
      footprintHa = 8100;
    } else if (res.includes('0.5') || res.includes('50km')) {
      footprintHa = 250000;
    } else if (res.includes('250m')) {
      footprintHa = 6.25;
    } else if (res.includes('30m')) {
      footprintHa = 0.09;
    }

    const farmHa = Number(farmAreaHa) || 1.0;
    const ratio = Math.round((footprintHa / farmHa) * 10) / 10;
    const isSubPixel = ratio > 1.0;

    let warning = null;
    if (isSubPixel) {
      warning = `Coarse observation footprint (${spatialResolutionStr}, ~${footprintHa} ha) is ${ratio}x larger than farm parcel (${farmHa} ha). Represents regional background rather than micro-parcel sensor reading.`;
    }

    return {
      farmAreaHa: farmHa,
      pixelFootprintHa: footprintHa,
      ratio,
      isSubPixelObservation: isSubPixel,
      spatialWarning: warning
    };
  }
}
