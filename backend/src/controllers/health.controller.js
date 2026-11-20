import { config } from '../config/env.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { getDatabaseStatus } from '../config/database.js';

/**
 * Liveness probe: reports gateway process liveness and subsystem status
 */
export function getHealth(req, res) {
  const memory = process.memoryUsage();
  const dbStatus = getDatabaseStatus();

  const healthData = {
    service: 'KRISHI-MITRA Backend API Gateway',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env,
    nodeVersion: process.version,
    memoryUsageMB: {
      rss: Math.round(memory.rss / (1024 * 1024)),
      heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
      heapUsed: Math.round(memory.heapUsed / (1024 * 1024))
    },
    database: {
      status: dbStatus.status,
      isConnected: dbStatus.isConnected,
      ...(dbStatus.host && { host: dbStatus.host }),
      ...(dbStatus.name && { databaseName: dbStatus.name })
    },
    routing: {
      activePrefixes: ['/api', '/api/v1'],
      compatibilityMode: 'Dual-Mount Legacy & Versioned'
    }
  };

  return successResponse(res, {
    statusCode: 200,
    message: 'KRISHI-MITRA API Gateway is operating nominally.',
    data: healthData,
    meta: {
      stage: 'Stage 3 — MongoDB Atlas Integration & Models',
      geography: 'West Bengal, India'
    }
  });
}

/**
 * Readiness probe: checks if database is connected and ready to accept traffic
 * Returns HTTP 200 when database is connected, or HTTP 503 when disconnected.
 */
export function getReadiness(req, res) {
  const dbStatus = getDatabaseStatus();

  if (dbStatus.isConnected) {
    return successResponse(res, {
      statusCode: 200,
      message: 'KRISHI-MITRA API Gateway and Database are ready to accept traffic.',
      data: {
        service: 'KRISHI-MITRA Backend API Gateway',
        status: 'ready',
        database: dbStatus
      }
    });
  }

  return errorResponse(res, {
    statusCode: 503,
    message: 'Service Unavailable: MongoDB Atlas connection is not established.',
    errorCode: 'DATABASE_NOT_READY',
    details: {
      database: dbStatus,
      remediation: 'Ensure MONGODB_URI is configured and network access is permitted in MongoDB Atlas.'
    }
  });
}
