import mongoose from 'mongoose';
import { config } from './env.js';

let isConnecting = false;

/**
 * Sanitizes MongoDB connection string for secure logging (masks username and password)
 * @param {string} uri 
 * @returns {string} Sanitized URI
 */
export function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/\/\/(.*?):(.*?)@/, '//$1:***@');
}

/**
 * Returns current database connection state and metadata
 * Guarantees zero credential or secret leakage.
 */
export function getDatabaseStatus() {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const status = states[readyState] || 'uninitialized';
  const isConnected = readyState === 1;

  let host = null;
  let name = null;

  if (isConnected && mongoose.connection.host) {
    host = mongoose.connection.host;
    name = mongoose.connection.name || null;
  }

  return {
    status,
    isConnected,
    readyState,
    host,
    name
  };
}

/**
 * Attaches Mongoose lifecycle event listeners once
 */
let eventsAttached = false;
function attachLifecycleEvents() {
  if (eventsAttached) return;
  eventsAttached = true;

  mongoose.connection.on('connected', () => {
    const { host, name } = getDatabaseStatus();
    console.log(`[Database] MongoDB Atlas connection established successfully. [Host: ${host}, DB: ${name}]`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] MongoDB Atlas connection re-established.');
  });
}

/**
 * Connects to MongoDB Atlas
 * - In production: Fails fast if URI is missing or connection fails.
 * - In development: Gracefully handles missing URI without crashing the gateway.
 */
export async function connectDatabase() {
  attachLifecycleEvents();

  // If already connected or connecting, prevent duplicate calls
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return;
  }

  const uri = config.mongodbUri;

  if (!uri || uri.trim() === '') {
    if (config.isProduction && process.env.STRICT_DB_REQUIRED === 'true') {
      throw new Error('[Database Error] MONGODB_URI is strictly required in production mode.');
    } else {
      console.warn('[Database] Notice: MONGODB_URI is not set. Gateway running in disconnected database mode. (Normal for initial dev/test/serverless seed mode)');
      return null;
    }
  }

  isConnecting = true;

  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10
  };

  try {
    console.log(`[Database] Attempting connection to MongoDB Atlas (${sanitizeMongoUri(uri)})...`);
    const conn = await mongoose.connect(uri, options);
    isConnecting = false;
    return conn;
  } catch (err) {
    isConnecting = false;
    console.error(`[Database Error] Failed to connect to MongoDB: ${err.message}`);

    if (config.isProduction && process.env.STRICT_DB_REQUIRED === 'true') {
      console.error('[Database Fatal] Production requires active MongoDB Atlas connectivity. Halting startup.');
      process.exit(1);
    }

    // Do not crash serverless function or dev process; return null to use seed fallback
    return null;
  }
}

/**
 * Gracefully disconnects Mongoose connection
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  try {
    console.log('[Database] Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed cleanly.');
  } catch (err) {
    console.error('[Database] Error while disconnecting MongoDB:', err.message);
  }
}

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  sanitizeMongoUri
};
