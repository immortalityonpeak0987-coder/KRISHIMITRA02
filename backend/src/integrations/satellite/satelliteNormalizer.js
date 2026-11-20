/**
 * NASA Satellite Data Normalizer
 * 
 * Transforms raw satellite extractions, granules, and point series into
 * standardized KRISHI-MITRA environmental observations and satellite assets.
 * 
 * Scientific Integrity Rules:
 * 1. Missing values (-3000, -9999) MUST normalize to null, never coerced to 0.
 * 2. Genuine zero rainfall (0.0 mm) represents genuine lack of precipitation and is preserved.
 * 3. Scale factor (0.0001) applied to raw MODIS integer NDVI.
 * 4. Surface soil moisture (0-5 cm) must not be represented as full root-zone moisture.
 * 5. Coarse resolutions (9km, 10km, 250m) are compared against farm parcel area.
 */

import {
  NASA_SATELLITE_PRODUCTS,
  SATELLITE_STATUS,
  SCIENTIFIC_DISCLAIMER,
  calculateSpatialFootprint
} from './satelliteConfig.js';
import { modisClient } from './modisClient.js';
import { smapClient } from './smapClient.js';
import { gpmClient } from './gpmClient.js';

export function parseDate(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return { isoDate: now.toISOString().split('T')[0], dateObj: now };
  }
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return { isoDate: dateInput.toISOString().split('T')[0], dateObj: dateInput };
  }
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return { isoDate: parsed.toISOString().split('T')[0], dateObj: parsed };
  }
  const fallback = new Date();
  return { isoDate: fallback.toISOString().split('T')[0], dateObj: fallback };
}

/**
 * Normalizes MODIS 16-Day NDVI observations
 * 
 * @param {Array|object} rawData Point extraction series or single reading
 * @param {object} meta Request metadata (coordinates, farmAreaHectares, etc.)
 * @returns {object} Standardized NDVI asset with observations
 */
export function normalizeModisNdvi(rawData, meta = {}) {
  const spec = NASA_SATELLITE_PRODUCTS.MODIS_NDVI;
  const records = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
  const observations = [];

  let availableCount = 0;
  let missingCount = 0;

  for (const item of records) {
    const { isoDate, dateObj } = parseDate(item.date || item.Date || item.observationDate);
    const rawVal = item.rawVal !== undefined ? item.rawVal : (item.value !== undefined ? item.value : item.NDVI);
    const decoded = modisClient.decodeNdviValue(rawVal);

    if (decoded.qualityFlag === 'MISSING') {
      missingCount++;
    } else {
      availableCount++;
    }

    const qualityAssessment = item.viQuality !== undefined ? modisClient.decodeViQuality(item.viQuality) : null;

    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: spec.primaryLayer,
      parameter: spec.canonicalParameter,
      rawValue: decoded.rawVal,
      value: decoded.scaledVal,
      unit: spec.unit,
      qualityFlag: decoded.qualityFlag,
      sourceName: 'NASA_MODIS',
      sourceProduct: spec.fullIdentifier,
      spatialResolution: spec.spatialResolution,
      temporalResolution: spec.temporalResolution,
      dataOrigin: spec.dataOrigin,
      metadata: {
        platform: spec.platform,
        instrument: spec.instrument,
        scaleFactor: spec.scaleFactor,
        rawFillValueUsed: decoded.qualityFlag === 'MISSING',
        qualityAssessment
      }
    });
  }

  const spatialFootprint = calculateSpatialFootprint(spec.spatialResolutionMeters, meta.farmAreaHectares || null);

  let status = SATELLITE_STATUS.SUCCESS;
  if (observations.length === 0 || availableCount === 0) {
    status = SATELLITE_STATUS.NO_DATA_AVAILABLE;
  }

  return {
    status,
    dataset: 'MODIS',
    product: spec.fullIdentifier,
    parameter: spec.canonicalParameter,
    disclaimer: SCIENTIFIC_DISCLAIMER,
    spatialFootprint,
    summary: {
      totalObservations: observations.length,
      availableObservations: availableCount,
      missingObservations: missingCount
    },
    observations
  };
}

/**
 * Normalizes SMAP Soil Moisture observations
 * 
 * @param {Array|object} rawData
 * @param {object} meta
 * @returns {object}
 */
export function normalizeSmapSoilMoisture(rawData, meta = {}) {
  const spec = meta.productVersion === '008' ? NASA_SATELLITE_PRODUCTS.SMAP_SOIL_MOISTURE_L4 : NASA_SATELLITE_PRODUCTS.SMAP_SOIL_MOISTURE_L3;
  const records = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
  const observations = [];

  let availableCount = 0;
  let missingCount = 0;

  for (const item of records) {
    const { isoDate, dateObj } = parseDate(item.date || item.Date || item.observationDate);
    const rawVal = item.rawVal !== undefined ? item.rawVal : (item.value !== undefined ? item.value : item.soil_moisture);
    const depthCategory = item.depthCategory || (item.isRootZone ? 'ROOT_ZONE' : 'SURFACE');
    const decoded = smapClient.decodeSoilMoistureValue(rawVal, depthCategory);

    if (decoded.qualityFlag === 'MISSING') {
      missingCount++;
    } else {
      availableCount++;
    }

    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: spec.primaryLayer,
      parameter: spec.canonicalParameter,
      rawValue: decoded.rawVal,
      value: decoded.scaledVal,
      unit: spec.unit,
      qualityFlag: decoded.qualityFlag,
      sourceName: 'NASA_SMAP',
      sourceProduct: spec.fullIdentifier,
      spatialResolution: spec.spatialResolution,
      temporalResolution: spec.temporalResolution,
      dataOrigin: spec.dataOrigin,
      metadata: {
        platform: spec.platform,
        instrument: spec.instrument,
        depthCategory: decoded.depthCategory,
        isRootZone: depthCategory === 'ROOT_ZONE',
        rawFillValueUsed: decoded.qualityFlag === 'MISSING'
      }
    });
  }

  const spatialFootprint = calculateSpatialFootprint(spec.spatialResolutionMeters, meta.farmAreaHectares || null);

  let status = SATELLITE_STATUS.SUCCESS;
  if (observations.length === 0 || availableCount === 0) {
    status = SATELLITE_STATUS.NO_DATA_AVAILABLE;
  }

  return {
    status,
    dataset: 'SMAP',
    product: spec.fullIdentifier,
    parameter: spec.canonicalParameter,
    depthSpecifications: smapClient.getDepthSpecifications(),
    disclaimer: SCIENTIFIC_DISCLAIMER,
    spatialFootprint,
    summary: {
      totalObservations: observations.length,
      availableObservations: availableCount,
      missingObservations: missingCount
    },
    observations
  };
}

/**
 * Normalizes GPM IMERG Precipitation observations
 * 
 * @param {Array|object} rawData
 * @param {object} meta
 * @returns {object}
 */
export function normalizeGpmImerg(rawData, meta = {}) {
  const isFinal = meta.runType === 'FINAL';
  const spec = isFinal ? NASA_SATELLITE_PRODUCTS.GPM_IMERG_FINAL : NASA_SATELLITE_PRODUCTS.GPM_IMERG_LATE;
  const records = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
  const observations = [];

  let availableCount = 0;
  let missingCount = 0;

  for (const item of records) {
    const { isoDate, dateObj } = parseDate(item.date || item.Date || item.observationDate);
    const rawVal = item.rawVal !== undefined ? item.rawVal : (item.value !== undefined ? item.value : item.precipitation);
    const decoded = gpmClient.decodePrecipitationValue(rawVal, spec.runType);

    if (decoded.qualityFlag === 'MISSING') {
      missingCount++;
    } else {
      availableCount++;
    }

    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: spec.primaryLayer,
      parameter: spec.canonicalParameter,
      rawValue: decoded.rawVal,
      value: decoded.scaledVal,
      unit: spec.unit,
      qualityFlag: decoded.qualityFlag,
      sourceName: 'NASA_GPM',
      sourceProduct: spec.fullIdentifier,
      spatialResolution: spec.spatialResolution,
      temporalResolution: spec.temporalResolution,
      dataOrigin: spec.dataOrigin,
      metadata: {
        platform: spec.platform,
        instrument: spec.instrument,
        runType: spec.runType,
        latency: spec.latency,
        gaugeCalibrated: spec.gaugeCalibrated,
        isZeroRainfall: decoded.isZeroRainfall || false,
        rawFillValueUsed: decoded.qualityFlag === 'MISSING'
      }
    });
  }

  const spatialFootprint = calculateSpatialFootprint(spec.spatialResolutionMeters, meta.farmAreaHectares || null);

  let status = SATELLITE_STATUS.SUCCESS;
  if (observations.length === 0 || availableCount === 0) {
    status = SATELLITE_STATUS.NO_DATA_AVAILABLE;
  }

  return {
    status,
    dataset: 'GPM_IMERG',
    product: spec.fullIdentifier,
    parameter: spec.canonicalParameter,
    runSpecifications: gpmClient.getRunSpecifications(),
    disclaimer: SCIENTIFIC_DISCLAIMER,
    spatialFootprint,
    summary: {
      totalObservations: observations.length,
      availableObservations: availableCount,
      missingObservations: missingCount
    },
    observations
  };
}
