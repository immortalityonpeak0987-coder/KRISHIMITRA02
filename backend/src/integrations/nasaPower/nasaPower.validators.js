import {
  NASA_POWER_CONFIG,
  NASA_POWER_PARAMETERS,
  DEFAULT_PARAMETERS,
  INTEGRATION_STATUS
} from './nasaPower.constants.js';

/**
 * Validates geographical coordinates
 * @param {number|string} lat Latitude
 * @param {number|string} lon Longitude
 * @returns {{ isValid: boolean, error?: string, statusCode?: string, latitude?: number, longitude?: number }}
 */
export function validateCoordinates(lat, lon) {
  if (lat === undefined || lat === null || lat === '' || lon === undefined || lon === null || lon === '') {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_COORDINATES,
      error: 'Both latitude and longitude parameters are required.'
    };
  }

  const latitude = Number(lat);
  const longitude = Number(lon);

  if (isNaN(latitude) || !isFinite(latitude)) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_COORDINATES,
      error: 'Latitude must be a valid finite number.'
    };
  }

  if (isNaN(longitude) || !isFinite(longitude)) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_COORDINATES,
      error: 'Longitude must be a valid finite number.'
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_COORDINATES,
      error: `Latitude '${latitude}' is outside the valid range of -90 to 90 degrees.`
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_COORDINATES,
      error: `Longitude '${longitude}' is outside the valid range of -180 to 180 degrees.`
    };
  }

  return {
    isValid: true,
    latitude,
    longitude
  };
}

/**
 * Parses and normalizes date string into YYYYMMDD and Date object
 * @param {string} dateStr 
 * @returns {{ date: Date, yyyymmdd: string }|null}
 */
function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();

  // Format 1: YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return {
        date: d,
        yyyymmdd: `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`
      };
    }
    return null;
  }

  // Format 2: YYYYMMDD
  const rawMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  if (rawMatch) {
    const year = parseInt(rawMatch[1], 10);
    const month = parseInt(rawMatch[2], 10) - 1;
    const day = parseInt(rawMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return {
        date: d,
        yyyymmdd: trimmed
      };
    }
    return null;
  }

  return null;
}

/**
 * Validates date range for NASA POWER query
 * @param {string} start 
 * @param {string} end 
 * @returns {{ isValid: boolean, error?: string, statusCode?: string, start?: string, end?: string, startDate?: Date, endDate?: Date }}
 */
export function validateDateRange(start, end) {
  if (!start || !end) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_DATE_RANGE,
      error: 'Both startDate and endDate are required parameters (format: YYYY-MM-DD or YYYYMMDD).'
    };
  }

  const parsedStart = parseDate(start);
  if (!parsedStart) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_DATE_RANGE,
      error: `Invalid startDate: '${start}'. Expected format YYYY-MM-DD or YYYYMMDD with valid calendar date.`
    };
  }

  const parsedEnd = parseDate(end);
  if (!parsedEnd) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_DATE_RANGE,
      error: `Invalid endDate: '${end}'. Expected format YYYY-MM-DD or YYYYMMDD with valid calendar date.`
    };
  }

  if (parsedStart.date > parsedEnd.date) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_DATE_RANGE,
      error: `startDate (${parsedStart.yyyymmdd}) cannot be later than endDate (${parsedEnd.yyyymmdd}).`
    };
  }

  // Prevent querying future observations
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (parsedStart.date > todayUtc || parsedEnd.date > todayUtc) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_DATE_RANGE,
      error: 'Cannot request future dates. NASA POWER provides historical meteorological and agroclimatology observations.'
    };
  }

  // Enforce max date window
  const diffDays = Math.round((parsedEnd.date - parsedStart.date) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > NASA_POWER_CONFIG.MAX_DATE_RANGE_DAYS) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.INVALID_DATE_RANGE,
      error: `Requested date range of ${diffDays} days exceeds maximum allowable window of ${NASA_POWER_CONFIG.MAX_DATE_RANGE_DAYS} days.`
    };
  }

  return {
    isValid: true,
    start: parsedStart.yyyymmdd,
    end: parsedEnd.yyyymmdd,
    startDate: parsedStart.date,
    endDate: parsedEnd.date,
    dayCount: diffDays
  };
}

/**
 * Validates parameter allowlist
 * @param {string|string[]} params 
 * @returns {{ isValid: boolean, error?: string, statusCode?: string, parameters?: string[] }}
 */
export function validateParameters(params) {
  if (!params) {
    return {
      isValid: true,
      parameters: [...DEFAULT_PARAMETERS]
    };
  }

  let paramList = [];
  if (Array.isArray(params)) {
    paramList = params.map(p => String(p).trim()).filter(Boolean);
  } else if (typeof params === 'string') {
    paramList = params.split(',').map(p => p.trim()).filter(Boolean);
  } else {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.UNSUPPORTED_PARAMETER,
      error: 'Parameters must be a comma-separated string or array of parameter identifiers.'
    };
  }

  if (paramList.length === 0) {
    return {
      isValid: true,
      parameters: [...DEFAULT_PARAMETERS]
    };
  }

  // Check against verified catalog
  const invalid = [];
  const valid = [];

  for (const p of paramList) {
    const upper = p.toUpperCase();
    if (NASA_POWER_PARAMETERS[upper]) {
      if (!valid.includes(upper)) valid.push(upper);
    } else {
      invalid.push(p);
    }
  }

  if (invalid.length > 0) {
    return {
      isValid: false,
      statusCode: INTEGRATION_STATUS.UNSUPPORTED_PARAMETER,
      error: `Unsupported NASA POWER parameter(s): ${invalid.join(', ')}. Verified parameters: ${Object.keys(NASA_POWER_PARAMETERS).join(', ')}`
    };
  }

  return {
    isValid: true,
    parameters: valid
  };
}

/**
 * Validates MongoDB ObjectId format
 * @param {string} id 
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateObjectId(id) {
  if (!id || typeof id !== 'string') {
    return {
      isValid: false,
      error: 'A valid 24-character hexadecimal MongoDB ObjectId is required.'
    };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return {
      isValid: false,
      error: `Invalid ID format: '${id}'. Must be a 24-character hexadecimal string.`
    };
  }

  return {
    isValid: true
  };
}
