import { config } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

/**
 * 404 Not Found Middleware
 * Intercepts unmapped endpoints and returns standard KRISHI-MITRA JSON error
 */
export function notFoundHandler(req, res) {
  return errorResponse(res, {
    statusCode: 404,
    message: `Endpoint '${req.method} ${req.originalUrl}' was not found on this server.`,
    errorCode: 'ENDPOINT_NOT_FOUND',
    details: {
      path: req.originalUrl,
      method: req.method,
      availableBaseRoutes: ['/api/health', '/api/v1/health']
    }
  });
}

/**
 * Centralized Error Handling Middleware
 * Guarantees zero stack trace leaks in production environments.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  // Log error with structured details
  if (!config.isTest) {
    console.error(`[KRISHI-MITRA Error] ${req.method} ${req.originalUrl}:`, {
      statusCode,
      errorCode,
      message: err.message,
      ...(config.isDevelopment && { stack: err.stack })
    });
  }

  // Sanitize message in production for internal errors
  const message = (config.isProduction && statusCode === 500)
    ? 'An unexpected internal error occurred on the server.'
    : err.message || 'Internal Server Error';

  return errorResponse(res, {
    statusCode,
    message,
    errorCode,
    details: config.isDevelopment ? { stack: err.stack } : null
  });
}
