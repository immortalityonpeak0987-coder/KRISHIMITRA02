/**
 * Environmental Observation Normalizer
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import {
  STANDARD_PARAMETERS,
  STANDARD_UNITS,
  PARAMETER_ALIASES,
  PHYSICAL_RANGES,
  QUALITY_STATES
} from './environmentalConstants.js';

export class EnvironmentalNormalizer {
  static resolveParameter(paramName) {
    if (!paramName) return null;
    const clean = String(paramName).trim().toUpperCase();
    return PARAMETER_ALIASES[clean] || null;
  }

  static isFillValue(val, source = '') {
    if (val === null || val === undefined || val === '') return true;
    if (typeof val === 'string') {
      const s = val.trim().toUpperCase();
      if (s === 'NA' || s === 'N/A' || s === 'NULL' || s === 'NAN') return true;
    }
    const num = Number(val);
    if (Number.isNaN(num)) return true;
    if (num === -999 || num === -99.9 || num === -99 || num === -3000 || num <= -9990.0) return true;
    return false;
  }

  static convertUnit(value, fromUnit, toUnit, parameter) {
    if (value === null || value === undefined) return null;
    const v = Number(value);
    if (Number.isNaN(v)) return null;

    if (!fromUnit || !toUnit || fromUnit.trim().toLowerCase() === toUnit.trim().toLowerCase()) {
      return v;
    }

    const from = fromUnit.trim().toLowerCase();
    const to = toUnit.trim().toLowerCase();

    // Wind Speed: km/h or knots to m/s
    if (parameter === STANDARD_PARAMETERS.WIND_SPEED) {
      if ((from === 'km/h' || from === 'kmph') && to === 'm/s') {
        return Math.round((v / 3.6) * 100) / 100;
      }
      if (from === 'knots' && to === 'm/s') {
        return Math.round((v * 0.514444) * 100) / 100;
      }
    }

    // Temperature: Kelvin to Celsius
    if (
      parameter === STANDARD_PARAMETERS.SURFACE_TEMPERATURE ||
      parameter === STANDARD_PARAMETERS.TEMPERATURE_MAX ||
      parameter === STANDARD_PARAMETERS.TEMPERATURE_MIN
    ) {
      if ((from === 'k' || from === 'kelvin') && (to === '°c' || to === 'c' || to === 'celsius')) {
        return Math.round((v - 273.15) * 100) / 100;
      }
    }

    // Direct return if compatible or unmapped
    return v;
  }

  static normalizeObservation(rawObs) {
    if (!rawObs || typeof rawObs !== 'object') {
      throw new Error('Invalid raw observation object');
    }

    const parameter = this.resolveParameter(rawObs.parameter || rawObs.parameterName || rawObs.identifier);
    if (!parameter) {
      throw new Error(`Unsupported or unrecognized environmental parameter: ${rawObs.parameter}`);
    }

    const targetUnit = STANDARD_UNITS[parameter];
    const sourceName = rawObs.sourceName || rawObs.source || 'UNKNOWN_SOURCE';
    const dataOrigin = rawObs.dataOrigin || 'MODEL_ESTIMATE';
    const rawVal = rawObs.value !== undefined ? rawObs.value : rawObs.rawValue;
    const rawUnit = rawObs.unit || rawObs.originalUnit || targetUnit;

    // Check fill / missing value
    if (this.isFillValue(rawVal, sourceName)) {
      return {
        parameter,
        standardizedValue: null,
        standardizedUnit: targetUnit,
        originalValue: rawVal,
        originalUnit: rawUnit,
        source: sourceName,
        sourceProduct: rawObs.sourceProduct || rawObs.product || null,
        dataOrigin,
        observationDate: new Date(rawObs.observationDate || rawObs.date || Date.now()),
        retrievalTimestamp: new Date(),
        qualityState: QUALITY_STATES.MISSING,
        qualityDescription: 'Upstream fill/missing indicator value detected.',
        spatialResolution: rawObs.spatialResolution || null,
        temporalResolution: rawObs.temporalResolution || 'Daily',
        metadata: {
          isMissing: true,
          ...rawObs.metadata
        }
      };
    }

    // Scientific rule: Genuine physical 0.0 is preserved
    const numVal = Number(rawVal);
    const convertedVal = this.convertUnit(numVal, rawUnit, targetUnit, parameter);

    // Range validation
    const range = PHYSICAL_RANGES[parameter];
    let qualityState = QUALITY_STATES.VALID;
    let qualityDescription = 'Within valid physical range and verified format.';

    if (range) {
      if (convertedVal < range.min || convertedVal > range.max) {
        qualityState = QUALITY_STATES.OUT_OF_RANGE;
        qualityDescription = `Value ${convertedVal} ${targetUnit} is outside expected physical range [${range.min}, ${range.max}].`;
      }
    }

    return {
      parameter,
      standardizedValue: convertedVal,
      standardizedUnit: targetUnit,
      originalValue: numVal,
      originalUnit: rawUnit,
      source: sourceName,
      sourceProduct: rawObs.sourceProduct || rawObs.product || null,
      dataOrigin,
      observationDate: new Date(rawObs.observationDate || rawObs.date || Date.now()),
      retrievalTimestamp: new Date(),
      qualityState,
      qualityDescription,
      spatialResolution: rawObs.spatialResolution || null,
      temporalResolution: rawObs.temporalResolution || 'Daily',
      metadata: {
        isZeroRainfall: parameter === STANDARD_PARAMETERS.RAINFALL_ACCUMULATION && convertedVal === 0,
        ...rawObs.metadata
      }
    };
  }
}
