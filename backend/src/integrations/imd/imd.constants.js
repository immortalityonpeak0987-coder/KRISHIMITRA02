/**
 * India Meteorological Department (IMD) API Constants & Specifications
 * 
 * Official Portal: https://api.imd.gov.in / https://mausam.imd.gov.in
 * API Base: https://api.imd.gov.in/api/v1
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { WEST_BENGAL_DISTRICTS } from '../../models/Farm.js';

export const IMD_CONFIG = {
  DEFAULT_BASE_URL: 'https://api.imd.gov.in/api/v1',
  DEFAULT_TIMEOUT_MS: 10000,
  PORTAL_URL: 'https://api.imd.gov.in',
  DOCS_URL: 'https://mausam.imd.gov.in',

  // Dataset-specific cache durations reflecting official observation publishing cycles
  CACHE_TTL: {
    CURRENT_WX_MS: 30 * 60 * 1000,       // 30 minutes (synoptic reports update hourly)
    DISTRICT_RAINFALL_MS: 6 * 60 * 60 * 1000, // 6 hours (published 1-4 times daily)
    STATE_RAINFALL_MS: 12 * 60 * 60 * 1000,   // 12 hours (daily cumulative reports)
    AWS_DATA_MS: 15 * 60 * 1000          // 15 minutes (telemetry updates ~15-30m)
  },

  ENDPOINTS: {
    CURRENT_WX: '/current_wx',
    DISTRICT_RAINFALL: '/districtrainfall',
    STATE_RAINFALL: '/staterainfall',
    AWS_DATA: '/aws_data'
  }
};

/**
 * Standard IMD Integration Availability States
 * As mandated by Stage 5 specifications
 */
export const IMD_AVAILABILITY_STATES = {
  AVAILABLE: 'AVAILABLE',
  AWAITING_CREDENTIALS: 'AWAITING_CREDENTIALS',
  AWAITING_IP_APPROVAL: 'AWAITING_IP_APPROVAL',
  UNAVAILABLE: 'UNAVAILABLE',
  ERROR: 'ERROR'
};

/**
 * Standard Integration Status Codes
 */
export const IMD_STATUS = {
  SUCCESS: 'SUCCESS',
  CACHE_HIT: 'CACHE_HIT',
  PARTIAL_DATA: 'PARTIAL_DATA',
  NO_DATA_AVAILABLE: 'NO_DATA_AVAILABLE',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  UNSUPPORTED_DISTRICT: 'UNSUPPORTED_DISTRICT',
  UNSUPPORTED_STATION: 'UNSUPPORTED_STATION',
  AWAITING_CREDENTIALS: 'AWAITING_CREDENTIALS',
  AWAITING_IP_APPROVAL: 'AWAITING_IP_APPROVAL',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE'
};

/**
 * Verified West Bengal Surface Weather & Synoptic Reporting Stations (WMO / IMD IDs)
 */
export const WEST_BENGAL_IMD_STATIONS = {
  '42809': { id: '42809', name: 'Kolkata (Alipore)', district: 'Kolkata', latitude: 22.53, longitude: 88.33 },
  '42807': { id: '42807', name: 'Kolkata (Dum Dum)', district: 'North 24 Parganas', latitude: 22.65, longitude: 88.45 },
  '42704': { id: '42704', name: 'Burdwan', district: 'Purba Bardhaman', latitude: 23.23, longitude: 87.85 },
  '42707': { id: '42707', name: 'Krishnanagar', district: 'Nadia', latitude: 23.40, longitude: 88.50 },
  '42903': { id: '42903', name: 'Canning', district: 'South 24 Parganas', latitude: 22.31, longitude: 88.66 },
  '42700': { id: '42700', name: 'Bankura', district: 'Bankura', latitude: 23.23, longitude: 87.07 },
  '42803': { id: '42803', name: 'Midnapore', district: 'Paschim Medinipur', latitude: 22.42, longitude: 87.31 },
  '42500': { id: '42500', name: 'Malda', district: 'Malda', latitude: 25.03, longitude: 88.13 },
  '42399': { id: '42399', name: 'Jalpaiguri', district: 'Jalpaiguri', latitude: 26.53, longitude: 88.72 },
  '42398': { id: '42398', name: 'Siliguri', district: 'Darjeeling', latitude: 26.71, longitude: 88.43 },
  '42295': { id: '42295', name: 'Darjeeling', district: 'Darjeeling', latitude: 27.05, longitude: 88.27 },
  '42901': { id: '42901', name: 'Diamond Harbour', district: 'South 24 Parganas', latitude: 22.18, longitude: 88.20 },
  '42703': { id: '42703', name: 'Panagarh', district: 'Paschim Bardhaman', latitude: 23.45, longitude: 87.43 },
  '42702': { id: '42702', name: 'Sriniketan', district: 'Birbhum', latitude: 23.68, longitude: 87.70 }
};

export const SUPPORTED_WEST_BENGAL_DISTRICTS = WEST_BENGAL_DISTRICTS;

export const SCIENTIFIC_DISCLAIMER = (
  'IMD weather observations are surface and automatic station measurements (dataOrigin: OBSERVED) ' +
  'and aggregated district/state statistics. Station readings reflect localized instrument enclosures ' +
  'and must not be interpreted as field-level measurements across an entire agricultural block.'
);
