import {
  NASA_POWER_CONFIG,
  NASA_POWER_PARAMETERS,
  INTEGRATION_STATUS,
  SCIENTIFIC_DISCLAIMER
} from './nasaPower.constants.js';

/**
 * Checks whether an upstream value represents a NASA POWER missing fill value (-999)
 * @param {any} val 
 * @returns {boolean}
 */
export function isFillValue(val) {
  if (val === null || val === undefined) return true;
  const num = Number(val);
  if (isNaN(num)) return true;
  // NASA POWER fill value is documented as -999 or -999.0
  return Math.abs(num - NASA_POWER_CONFIG.FILL_VALUE) < 0.001;
}

/**
 * Converts YYYYMMDD string to ISO date string (YYYY-MM-DD) and Date object
 * @param {string} dateKey 
 * @returns {{ isoDate: string, dateObj: Date }}
 */
function parseDateKey(dateKey) {
  const year = parseInt(dateKey.substring(0, 4), 10);
  const month = parseInt(dateKey.substring(4, 6), 10) - 1;
  const day = parseInt(dateKey.substring(6, 8), 10);
  const dateObj = new Date(Date.UTC(year, month, day));
  const isoDate = `${dateKey.substring(0, 4)}-${dateKey.substring(4, 6)}-${dateKey.substring(6, 8)}`;
  return { isoDate, dateObj };
}

/**
 * Normalizes raw NASA POWER API response into standardized KRISHI-MITRA structure
 * 
 * @param {object} rawResponse Raw JSON from NASA POWER
 * @param {object} requestMeta Request parameters and coordinates
 * @returns {object} Normalized response with metadata, observations, and status
 */
export function normalizeNasaPowerResponse(rawResponse, requestMeta = {}) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    throw new Error('Cannot normalize invalid or non-object NASA POWER response.');
  }

  const parameterPayload = rawResponse.properties?.parameter;
  if (!parameterPayload || typeof parameterPayload !== 'object') {
    return {
      status: INTEGRATION_STATUS.NO_DATA_AVAILABLE,
      disclaimer: SCIENTIFIC_DISCLAIMER,
      meta: {
        source: 'NASA_POWER',
        retrievedAt: new Date().toISOString(),
        requestCoordinates: {
          latitude: requestMeta.latitude ?? null,
          longitude: requestMeta.longitude ?? null
        },
        gridCoordinates: null,
        elevationMeters: null
      },
      summary: {
        totalDays: 0,
        parametersRequested: requestMeta.parameters || [],
        totalObservations: 0,
        availableObservations: 0,
        missingObservations: 0
      },
      observationsByDate: {},
      flatObservations: []
    };
  }

  // Extract grid coordinates and elevation from geometry if available
  const coords = rawResponse.geometry?.coordinates;
  const gridCoordinates = (Array.isArray(coords) && coords.length >= 2) ? {
    longitude: coords[0],
    latitude: coords[1]
  } : null;
  const elevationMeters = (Array.isArray(coords) && coords.length >= 3) ? coords[2] : null;

  const requestedParams = requestMeta.parameters && requestMeta.parameters.length > 0
    ? requestMeta.parameters
    : Object.keys(parameterPayload);

  // Collect all unique date keys across parameters
  const allDateKeysSet = new Set();
  for (const paramKey of requestedParams) {
    const paramData = parameterPayload[paramKey];
    if (paramData && typeof paramData === 'object') {
      for (const d of Object.keys(paramData)) {
        allDateKeysSet.add(d);
      }
    }
  }

  const sortedDateKeys = Array.from(allDateKeysSet).sort();
  const totalDays = sortedDateKeys.length;

  let totalObservations = 0;
  let availableObservations = 0;
  let missingObservations = 0;

  const observationsByDate = {};
  const flatObservations = [];

  for (const dateKey of sortedDateKeys) {
    const { isoDate, dateObj } = parseDateKey(dateKey);
    observationsByDate[isoDate] = {};

    for (const paramKey of requestedParams) {
      totalObservations++;
      const paramSpec = NASA_POWER_PARAMETERS[paramKey] || {
        identifier: paramKey,
        description: paramKey,
        unit: 'unknown',
        sourceModel: 'MERRA-2',
        spatialResolution: '0.5° × 0.625°',
        temporalResolution: 'daily',
        canonicalParameter: 'SURFACE_TEMPERATURE',
        measurementStatistic: 'MEAN'
      };

      const rawVal = parameterPayload[paramKey]?.[dateKey];
      const isMissing = isFillValue(rawVal);
      const normalizedValue = isMissing ? null : Number(rawVal);

      if (isMissing) {
        missingObservations++;
      } else {
        availableObservations++;
      }

      const qualityFlag = isMissing ? 'MISSING' : 'NOMINAL';

      const observationRecord = {
        date: isoDate,
        dateObj,
        rawParameter: paramKey,
        parameter: paramSpec.canonicalParameter,
        value: normalizedValue,
        unit: paramSpec.unit,
        qualityFlag,
        sourceName: 'NASA_POWER',
        sourceProduct: paramSpec.sourceModel,
        spatialResolution: paramSpec.spatialResolution,
        temporalResolution: paramSpec.temporalResolution,
        dataOrigin: 'MODEL_ESTIMATE',
        metadata: {
          description: paramSpec.description,
          measurementStatistic: paramSpec.measurementStatistic,
          timeStandard: NASA_POWER_CONFIG.TIME_STANDARD,
          requestCoordinates: {
            latitude: requestMeta.latitude,
            longitude: requestMeta.longitude
          },
          gridCoordinates,
          elevationMeters,
          rawFillValueUsed: isMissing
        }
      };

      observationsByDate[isoDate][paramKey] = {
        value: normalizedValue,
        unit: paramSpec.unit,
        qualityFlag,
        sourceModel: paramSpec.sourceModel,
        spatialResolution: paramSpec.spatialResolution,
        canonicalParameter: paramSpec.canonicalParameter,
        timeStandard: NASA_POWER_CONFIG.TIME_STANDARD
      };

      flatObservations.push(observationRecord);
    }
  }

  // Determine overall integration status
  let status = INTEGRATION_STATUS.SUCCESS;
  if (totalObservations === 0 || availableObservations === 0) {
    status = INTEGRATION_STATUS.NO_DATA_AVAILABLE;
  } else if (missingObservations > 0) {
    status = INTEGRATION_STATUS.PARTIAL_DATA;
  }

  return {
    status,
    disclaimer: SCIENTIFIC_DISCLAIMER,
    meta: {
      source: 'NASA_POWER',
      community: NASA_POWER_CONFIG.COMMUNITY,
      timeStandard: NASA_POWER_CONFIG.TIME_STANDARD,
      portalUrl: NASA_POWER_CONFIG.PORTAL_URL,
      docsUrl: NASA_POWER_CONFIG.DOCS_URL,
      retrievedAt: new Date().toISOString(),
      requestCoordinates: {
        latitude: requestMeta.latitude ?? null,
        longitude: requestMeta.longitude ?? null
      },
      gridCoordinates,
      elevationMeters,
      temporalCoverage: {
        startDate: sortedDateKeys[0] ? parseDateKey(sortedDateKeys[0]).isoDate : null,
        endDate: sortedDateKeys[sortedDateKeys.length - 1] ? parseDateKey(sortedDateKeys[sortedDateKeys.length - 1]).isoDate : null,
        totalDays
      }
    },
    summary: {
      totalDays,
      parametersRequested: requestedParams,
      totalObservations,
      availableObservations,
      missingObservations
    },
    observationsByDate,
    flatObservations
  };
}

export default {
  isFillValue,
  normalizeNasaPowerResponse
};
