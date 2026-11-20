import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

export const config = {
  env: NODE_ENV,
  isProduction: isProd,
  isDevelopment: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '5000', 10),
  
  // CORS Configuration
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // Database (Reserved for Stage 3)
  mongodbUri: process.env.MONGODB_URI || '',
  allowMemoryDb: process.env.ALLOW_MEMORY_DB !== 'false',

  // Authentication & Security (Reserved for Stage 4)
  jwtSecret: process.env.JWT_SECRET || 'krishi_mitra_default_jwt_secret_fallback',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  guestSessionSecret: process.env.GUEST_SESSION_SECRET || 'krishi_mitra_default_guest_secret_fallback',

  // IMD API Integration (Stage 5)
  imd: {
    baseUrl: process.env.IMD_API_BASE_URL || 'https://api.imd.gov.in/api/v1',
    apiKey: process.env.IMD_API_KEY || '',
    bearerToken: process.env.IMD_BEARER_TOKEN || '',
    timeoutMs: parseInt(process.env.IMD_TIMEOUT_MS || '10000', 10)
  },

  // Open Satellite Data Integration
  satellite: {
    appeearsBaseUrl: process.env.APPEEARS_BASE_URL || 'https://appeears.earthdatacloud.nasa.gov/api',
    cmrBaseUrl: process.env.CMR_BASE_URL || 'https://cmr.earthdata.nasa.gov/search',
    earthdataUsername: process.env.EARTHDATA_USERNAME || '',
    earthdataPassword: process.env.EARTHDATA_PASSWORD || '',
    earthdataToken: process.env.EARTHDATA_TOKEN || '',
    timeoutMs: parseInt(process.env.SATELLITE_TIMEOUT_MS || '15000', 10),
    cacheTtlMs: parseInt(process.env.SATELLITE_CACHE_TTL_MS || '86400000', 10)
  },

  // Google Earth Engine REST API Integration (API 8)
  earthEngine: {
    discoveryUrl: process.env.EARTH_ENGINE_DISCOVERY_URL || 'https://earthengine.googleapis.com/$discovery/rest?version=v1',
    baseUrl: process.env.EARTH_ENGINE_BASE_URL || 'https://earthengine.googleapis.com/v1',
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GEE_PROJECT_ID || '',
    keyFilePath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    timeoutMs: parseInt(process.env.EARTH_ENGINE_TIMEOUT_MS || '15000', 10),
    cacheTtlMs: parseInt(process.env.EARTH_ENGINE_CACHE_TTL_MS || '604800000', 10) // 7 days for discovery doc
  }
};

export const env = config;
export default config;

const ALLOWED_ENVIRONMENTS = ['development', 'production', 'test'];

// Stage 3 Environment Validation
export function validateProductionConfig() {
  const errors = [];
  
  if (!ALLOWED_ENVIRONMENTS.includes(config.env)) {
    errors.push(`Invalid NODE_ENV: '${config.env}'. Must be one of: ${ALLOWED_ENVIRONMENTS.join(', ')}.`);
  }

  if (isNaN(config.port) || config.port <= 0 || config.port > 65535) {
    errors.push(`Invalid PORT configuration: '${config.port}'. Must be an integer between 1 and 65535.`);
  }

  if (!config.frontendUrls || config.frontendUrls.length === 0) {
    errors.push('FRONTEND_URL must be specified to configure explicit CORS allowlisting.');
  }

  // In production, MONGODB_URI is mandatory and must have a valid protocol
  if (config.isProduction) {
    if (!config.mongodbUri || config.mongodbUri.trim() === '') {
      errors.push('MONGODB_URI is mandatory in production environment.');
    } else if (!/^mongodb(\+srv)?:\/\//.test(config.mongodbUri)) {
      errors.push('MONGODB_URI format is invalid. Must begin with mongodb:// or mongodb+srv://');
    }
  }

  if (errors.length > 0) {
    throw new Error(`[Configuration Error] Gateway validation failed:\n - ${errors.join('\n - ')}`);
  }
}
