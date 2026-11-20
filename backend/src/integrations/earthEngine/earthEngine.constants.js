/**
 * Google Earth Engine REST API Constants & Scientific Specifications
 * 
 * Official References:
 * - Discovery URL: https://earthengine.googleapis.com/$discovery/rest?version=v1
 * - REST Reference: https://developers.google.com/earth-engine/reference/rest
 * - Cloud Docs: https://cloud.google.com/earth-engine
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

export const EARTH_ENGINE_CONFIG = {
  DISCOVERY_URL: 'https://earthengine.googleapis.com/$discovery/rest?version=v1',
  BASE_URL: 'https://earthengine.googleapis.com/v1',
  DOCS_URL: 'https://developers.google.com/earth-engine/reference/rest',
  DEFAULT_TIMEOUT_MS: 15000,
  CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days (Discovery document changes infrequently)
  DEFAULT_PAGE_SIZE: 20
};

/**
 * Standard Integration Availability States
 */
export const EARTH_ENGINE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  AVAILABLE_WITH_LIMITATIONS: 'AVAILABLE_WITH_LIMITATIONS',
  PROJECT_CONFIGURATION_REQUIRED: 'PROJECT_CONFIGURATION_REQUIRED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAVAILABLE: 'UNAVAILABLE',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  CACHE_HIT: 'CACHE_HIT',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR'
};

/**
 * Google Cloud IAM Roles and Scopes required for Earth Engine REST execution
 */
export const REQUIRED_CREDENTIALS_SPEC = {
  scopes: [
    'https://www.googleapis.com/auth/earthengine',
    'https://www.googleapis.com/auth/cloud-platform'
  ],
  recommendedIamRoles: [
    'roles/earthengine.reader',
    'roles/earthengine.writer',
    'roles/serviceusage.serviceUsageConsumer'
  ],
  requiredEnvironmentVariables: [
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_APPLICATION_CREDENTIALS'
  ]
};

export const SCIENTIFIC_DISCLAIMER = (
  'Google Earth Engine is a planetary-scale cloud geospatial analysis platform. ' +
  'Accessing computation, image collections, and asset workflows requires an authenticated ' +
  'Google Cloud project with the Earth Engine API enabled. Discovery document endpoints ' +
  'provide upstream schema specifications and do not imply active computational pipeline execution.'
);
