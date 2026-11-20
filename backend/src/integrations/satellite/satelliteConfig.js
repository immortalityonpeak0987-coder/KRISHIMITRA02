/**
 * NASA Satellite Data Integration Constants & Product Catalog
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

export const SATELLITE_CONFIG = {
  APPEEARS_BASE_URL: 'https://appeears.earthdatacloud.nasa.gov/api',
  CMR_BASE_URL: 'https://cmr.earthdata.nasa.gov/search',
  DEFAULT_TIMEOUT_MS: 15000,
  CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours for satellite catalog and observation caches

  // West Bengal approximate spatial bounding box [minLon, minLat, maxLon, maxLat]
  WEST_BENGAL_BOUNDING_BOX: {
    minLon: 85.80,
    minLat: 21.50,
    maxLon: 89.90,
    maxLat: 27.30
  }
};

export const SATELLITE_STATUS = {
  SUCCESS: 'SUCCESS',
  CACHE_HIT: 'CACHE_HIT',
  TASK_SUBMITTED: 'TASK_SUBMITTED',
  TASK_PENDING: 'TASK_PENDING',
  TASK_PROCESSING: 'TASK_PROCESSING',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  AWAITING_CREDENTIALS: 'AWAITING_CREDENTIALS',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  NO_DATA_AVAILABLE: 'NO_DATA_AVAILABLE',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE'
};

/**
 * Verified NASA Satellite Products Catalog
 */
export const NASA_SATELLITE_PRODUCTS = {
  MODIS_NDVI: {
    id: 'MOD13Q1',
    version: '061',
    fullIdentifier: 'MOD13Q1.061',
    name: 'MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061',
    platform: 'Terra',
    instrument: 'MODIS',
    parameter: 'NDVI',
    canonicalParameter: 'NDVI',
    primaryLayer: '_250m_16_days_NDVI',
    qualityLayer: '_250m_16_days_VI_Quality',
    spatialResolution: '250m',
    spatialResolutionMeters: 250,
    pixelAreaHectares: 6.25,
    temporalResolution: '16-day',
    unit: 'index',
    scaleFactor: 0.0001,
    offset: 0.0,
    validRange: { rawMin: -2000, rawMax: 10000, scaledMin: -0.2, scaledMax: 1.0 },
    fillValue: -3000,
    dataOrigin: 'SATELLITE_DERIVED',
    description: '16-day composite Normalized Difference Vegetation Index (NDVI) at 250m resolution.'
  },

  SMAP_SOIL_MOISTURE_L3: {
    id: 'SPL3SMP_E',
    version: '006',
    fullIdentifier: 'SPL3SMP_E.006',
    name: 'SMAP Enhanced L3 Radiometer Global Daily 9 km EASE-Grid Soil Moisture V006',
    platform: 'SMAP',
    instrument: 'L-band Radiometer (1.413 GHz)',
    parameter: 'SOIL_MOISTURE',
    canonicalParameter: 'SOIL_MOISTURE',
    depthCategory: 'SURFACE (0-5 cm)',
    primaryLayer: 'Soil_Moisture_Retrieval_Data_AM_soil_moisture',
    qualityLayer: 'Soil_Moisture_Retrieval_Data_AM_retrieval_qual_flag',
    spatialResolution: '9km',
    spatialResolutionMeters: 9000,
    pixelAreaHectares: 8100,
    temporalResolution: 'daily',
    unit: 'cm³/cm³',
    scaleFactor: 1.0,
    offset: 0.0,
    validRange: { rawMin: 0.0, rawMax: 0.9, scaledMin: 0.0, scaledMax: 0.9 },
    fillValue: -9999.0,
    dataOrigin: 'SATELLITE_DERIVED',
    description: 'Daily passive microwave surface volumetric soil moisture (top 5 cm) at 9 km EASE-Grid 2.0.'
  },

  SMAP_SOIL_MOISTURE_L4: {
    id: 'SPL4SMAU',
    version: '008',
    fullIdentifier: 'SPL4SMAU.008',
    name: 'SMAP L4 Global 3-hourly 9 km EASE-Grid Surface and Root Zone Soil Moisture Analysis Update V008',
    platform: 'SMAP',
    instrument: 'L-band Radiometer & GEOS-5 Catchment Model Assimilation',
    parameter: 'SOIL_MOISTURE',
    canonicalParameter: 'SOIL_MOISTURE',
    depthCategory: 'SURFACE (0-5 cm) & ROOT-ZONE (0-100 cm)',
    primaryLayer: 'sm_surface_analysis',
    rootZoneLayer: 'sm_rootzone_analysis',
    spatialResolution: '9km',
    spatialResolutionMeters: 9000,
    pixelAreaHectares: 8100,
    temporalResolution: '3-hourly',
    unit: 'cm³/cm³',
    scaleFactor: 1.0,
    offset: 0.0,
    validRange: { rawMin: 0.0, rawMax: 0.9, scaledMin: 0.0, scaledMax: 0.9 },
    fillValue: -9999.0,
    dataOrigin: 'MODEL_ESTIMATE',
    description: 'Model-assimilated surface (0-5cm) and root-zone (0-100cm) volumetric soil moisture.'
  },

  GPM_IMERG_LATE: {
    id: 'GPM_3IMERGDL',
    version: '07',
    fullIdentifier: 'GPM_3IMERGDL.07',
    name: 'GPM IMERG Late Precipitation L3 1 day 0.1 degree x 0.1 degree V07 (GPM_3IMERGDL)',
    platform: 'GPM Core Observatory & Constellation',
    instrument: 'GMI / DPR / Microwave Constellation',
    parameter: 'RAINFALL_ACCUMULATION',
    canonicalParameter: 'RAINFALL_ACCUMULATION',
    runType: 'LATE',
    latency: '~14 hours',
    gaugeCalibrated: false,
    climatologicalAdjustment: true,
    primaryLayer: 'precipitationCal',
    spatialResolution: '0.1° (~10km)',
    spatialResolutionMeters: 10000,
    pixelAreaHectares: 10000,
    temporalResolution: 'daily',
    unit: 'mm/day',
    scaleFactor: 1.0,
    offset: 0.0,
    validRange: { rawMin: 0.0, rawMax: 1000.0, scaledMin: 0.0, scaledMax: 1000.0 },
    fillValue: -9999.9,
    dataOrigin: 'SATELLITE_DERIVED',
    description: 'Operational daily precipitation with climatological adjustment, ~14h latency, ideal for ongoing crop monitoring.'
  },

  GPM_IMERG_FINAL: {
    id: 'GPM_3IMERGDF',
    version: '07',
    fullIdentifier: 'GPM_3IMERGDF.07',
    name: 'GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V07 (GPM_3IMERGDF)',
    platform: 'GPM Core Observatory & Constellation',
    instrument: 'GMI / DPR / Microwave Constellation',
    parameter: 'RAINFALL_ACCUMULATION',
    canonicalParameter: 'RAINFALL_ACCUMULATION',
    runType: 'FINAL',
    latency: '~3.5 months',
    gaugeCalibrated: true,
    primaryLayer: 'precipitationCal',
    spatialResolution: '0.1° (~10km)',
    spatialResolutionMeters: 10000,
    pixelAreaHectares: 10000,
    temporalResolution: 'daily',
    unit: 'mm/day',
    scaleFactor: 1.0,
    offset: 0.0,
    validRange: { rawMin: 0.0, rawMax: 1000.0, scaledMin: 0.0, scaledMax: 1000.0 },
    fillValue: -9999.9,
    dataOrigin: 'SATELLITE_DERIVED',
    description: 'Research-grade daily precipitation adjusted with monthly GPCC rain gauge data (~3.5 months latency).'
  },

  HLS_LANDSAT: {
    id: 'HLSL30',
    version: '2.0',
    fullIdentifier: 'HLSL30.020',
    name: 'HLS Landsat Operational Land Imager Surface Reflectance and TOA Brightness Daily Global 30m v2.0',
    platform: 'Landsat 8/9',
    instrument: 'OLI / TIRS',
    parameter: 'SURFACE_REFLECTANCE',
    canonicalParameter: 'SURFACE_REFLECTANCE',
    spatialResolution: '30m',
    spatialResolutionMeters: 30,
    pixelAreaHectares: 0.09,
    temporalResolution: '2-3 day combined revisit',
    unit: 'reflectance (0-1)',
    scaleFactor: 0.0001,
    offset: 0.0,
    fillValue: -9999,
    dataOrigin: 'SATELLITE_OBSERVED',
    description: 'Harmonized Landsat 30m daily surface reflectance for high-resolution field parcel assessment.'
  }
};

/**
 * Calculates spatial footprint and evaluates sub-pixel relationship
 * 
 * @param {number} pixelResolutionMeters Product pixel size in meters (e.g. 250, 9000, 10000)
 * @param {number} [farmAreaHectares] Farm area in hectares
 * @returns {object} Spatial scale metrics and warnings
 */
export function calculateSpatialFootprint(pixelResolutionMeters, farmAreaHectares = null) {
  const pixelAreaSqMeters = pixelResolutionMeters * pixelResolutionMeters;
  const pixelAreaHectares = pixelAreaSqMeters / 10000;

  const result = {
    resolutionMeters: pixelResolutionMeters,
    pixelAreaHectares: Number(pixelAreaHectares.toFixed(2)),
    farmAreaHectares: farmAreaHectares !== null ? Number(Number(farmAreaHectares).toFixed(2)) : null,
    isSubPixelObservation: false,
    ratioFarmToPixel: null,
    spatialDisclaimer: null
  };

  if (farmAreaHectares !== null && farmAreaHectares > 0) {
    result.ratioFarmToPixel = Number((farmAreaHectares / pixelAreaHectares).toFixed(4));
    result.isSubPixelObservation = farmAreaHectares < pixelAreaHectares;

    if (result.isSubPixelObservation) {
      result.spatialDisclaimer = (
        `Farm area (${result.farmAreaHectares} ha) is smaller than the single satellite pixel footprint (${result.pixelAreaHectares} ha). ` +
        `Observations represent regional environmental conditions rather than micro-plot boundaries.`
      );
    }
  }

  return result;
}

export const SCIENTIFIC_DISCLAIMER = (
  'Satellite remote sensing products provide macro and regional observations. Coarse products (GPM IMERG 0.1° ~10km, ' +
  'SMAP 9km) must not be represented as field-level measurements on small agricultural plots (0.5-2.5 ha). ' +
  'MODIS 250m provides 16-day composited vegetation indices. Missing data (-3000, -9999) is strictly preserved as null.'
);
