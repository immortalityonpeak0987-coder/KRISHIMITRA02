/**
 * NASA POWER API Constants & Scientific Specifications
 * 
 * Official Documentation:
 * - NASA POWER Portal: https://power.larc.nasa.gov/
 * - NASA POWER Docs: https://power.larc.nasa.gov/docs/
 * - NASA POWER API: https://power.larc.nasa.gov/api/
 * 
 * Target User Community: Agroclimatology (AG)
 * Temporal Endpoint: Daily Point (/api/temporal/daily/point)
 */

export const NASA_POWER_CONFIG = {
  BASE_URL: 'https://power.larc.nasa.gov/api/temporal/daily/point',
  COMMUNITY: 'AG',
  OUTPUT_FORMAT: 'JSON',
  TIME_STANDARD: 'UTC', // Explicit UTC time standard (prevents default LST ambiguity)
  DEFAULT_TIMEOUT_MS: 10000, // 10 seconds
  CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours (historical daily gridded observations are static)
  MAX_DATE_RANGE_DAYS: 366, // Max 1 year per request window
  FILL_VALUE: -999, // Documented missing data fill value
  PORTAL_URL: 'https://power.larc.nasa.gov/',
  DOCS_URL: 'https://power.larc.nasa.gov/docs/'
};

/**
 * Verified Supported Parameters Catalog
 * Strictly grounded in official NASA POWER Agroclimatology documentation.
 * Preserves individual spatial resolution and primary source models.
 */
export const NASA_POWER_PARAMETERS = {
  T2M: {
    identifier: 'T2M',
    description: 'Temperature at 2 Metres',
    unit: '°C',
    sourceModel: 'MERRA-2',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'daily',
    canonicalParameter: 'SURFACE_TEMPERATURE',
    measurementStatistic: 'MEAN'
  },
  T2M_MAX: {
    identifier: 'T2M_MAX',
    description: 'Maximum Temperature at 2 Metres',
    unit: '°C',
    sourceModel: 'MERRA-2',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'daily',
    canonicalParameter: 'SURFACE_TEMPERATURE',
    measurementStatistic: 'MAX'
  },
  T2M_MIN: {
    identifier: 'T2M_MIN',
    description: 'Minimum Temperature at 2 Metres',
    unit: '°C',
    sourceModel: 'MERRA-2',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'daily',
    canonicalParameter: 'SURFACE_TEMPERATURE',
    measurementStatistic: 'MIN'
  },
  PRECTOTCORR: {
    identifier: 'PRECTOTCORR',
    description: 'Precipitation Corrected (Rainfall)',
    unit: 'mm/day',
    sourceModel: 'MERRA-2',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'daily',
    canonicalParameter: 'RAINFALL_ACCUMULATION',
    measurementStatistic: 'SUM'
  },
  RH2M: {
    identifier: 'RH2M',
    description: 'Relative Humidity at 2 Metres',
    unit: '%',
    sourceModel: 'MERRA-2',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'daily',
    canonicalParameter: 'RELATIVE_HUMIDITY',
    measurementStatistic: 'MEAN'
  },
  WS2M: {
    identifier: 'WS2M',
    description: 'Wind Speed at 2 Metres',
    unit: 'm/s',
    sourceModel: 'MERRA-2',
    spatialResolution: '0.5° × 0.625°',
    temporalResolution: 'daily',
    canonicalParameter: 'WIND_SPEED',
    measurementStatistic: 'MEAN'
  },
  ALLSKY_SFC_SW_DWN: {
    identifier: 'ALLSKY_SFC_SW_DWN',
    description: 'All-Sky Surface Shortwave Downward Irradiance',
    unit: 'MJ/m²/day',
    sourceModel: 'CERES SYN1deg / FLASHFlux / SRB (Solar Satellite Products)',
    spatialResolution: '1.0° × 1.0°',
    temporalResolution: 'daily',
    canonicalParameter: 'SOLAR_RADIATION',
    measurementStatistic: 'SUM'
  }
};

export const DEFAULT_PARAMETERS = Object.keys(NASA_POWER_PARAMETERS);

/**
 * Standard Integration Status Codes
 */
export const INTEGRATION_STATUS = {
  SUCCESS: 'SUCCESS',
  CACHE_HIT: 'CACHE_HIT',
  PARTIAL_DATA: 'PARTIAL_DATA',
  NO_DATA_AVAILABLE: 'NO_DATA_AVAILABLE',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  UNSUPPORTED_PARAMETER: 'UNSUPPORTED_PARAMETER',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE'
};

export const SCIENTIFIC_DISCLAIMER = (
  'NASA POWER observations are gridded, model-derived assimilation estimates ' +
  '(MERRA-2 for meteorology; CERES/FLASHFlux/SRB for solar radiation) and must not be ' +
  'interpreted as direct in-situ ground sensor measurements for an individual farm plot.'
);
