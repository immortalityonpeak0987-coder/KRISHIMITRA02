/**
 * Standardized API Response Builders for KRISHI-MITRA REST API
 * Guarantees consistent response structures matching the frontend expectations.
 */

export function successResponse(res, {
  statusCode = 200,
  message = 'Success',
  data = null,
  meta = null
} = {}) {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta })
  };

  return res.status(statusCode).json(payload);
}

export function errorResponse(res, {
  statusCode = 500,
  message = 'An unexpected error occurred',
  errorCode = 'INTERNAL_ERROR',
  details = null
} = {}) {
  const payload = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details && { details })
    }
  };

  return res.status(statusCode).json(payload);
}
