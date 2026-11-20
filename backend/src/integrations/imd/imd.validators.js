import {
  SUPPORTED_WEST_BENGAL_DISTRICTS,
  WEST_BENGAL_IMD_STATIONS,
  IMD_STATUS
} from './imd.constants.js';

/**
 * Validates and matches a West Bengal district name (case-insensitive)
 * @param {string} district 
 * @returns {{ isValid: boolean, error?: string, statusCode?: string, district?: string }}
 */
export function validateDistrict(district) {
  if (!district || typeof district !== 'string' || district.trim() === '') {
    return {
      isValid: false,
      statusCode: IMD_STATUS.INVALID_PARAMETERS,
      error: 'District name is required.'
    };
  }

  const query = district.trim().toLowerCase();
  const matched = SUPPORTED_WEST_BENGAL_DISTRICTS.find(
    d => d.toLowerCase() === query || d.toLowerCase().replace(/\s+/g, '') === query.replace(/\s+/g, '')
  );

  if (!matched) {
    return {
      isValid: false,
      statusCode: IMD_STATUS.UNSUPPORTED_DISTRICT,
      error: `Unsupported district '${district}'. Must be one of the 23 recognized districts of West Bengal.`
    };
  }

  return {
    isValid: true,
    district: matched
  };
}

/**
 * Validates station identifier
 * @param {string|number} stationId 
 * @returns {{ isValid: boolean, error?: string, statusCode?: string, stationId?: string, stationInfo?: object }}
 */
export function validateStationId(stationId) {
  if (!stationId) {
    return {
      isValid: true,
      stationId: null,
      stationInfo: null
    };
  }

  const idStr = String(stationId).trim();
  if (idStr.length < 3 || idStr.length > 20) {
    return {
      isValid: false,
      statusCode: IMD_STATUS.INVALID_PARAMETERS,
      error: `Invalid station ID '${stationId}'. Station identifiers must be between 3 and 20 characters.`
    };
  }

  const knownStation = WEST_BENGAL_IMD_STATIONS[idStr] || null;

  return {
    isValid: true,
    stationId: idStr,
    stationInfo: knownStation
  };
}

/**
 * Validates MongoDB ObjectId
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
