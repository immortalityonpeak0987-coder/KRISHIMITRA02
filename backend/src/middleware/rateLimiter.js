import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true, // Return standard RateLimit headers in response
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many requests. Please slow down and try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      details: {
        windowMs: config.rateLimit.windowMs,
        maxAllowed: config.rateLimit.max
      }
    });
  }
});
