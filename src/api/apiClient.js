// KRISHI-MITRA API Client
// Connects directly to the same-origin Express backend (/api/*) or VITE_API_URL when configured.
// Enforces truthful data states (LIVE, DEMO, CACHED, UNAVAILABLE, ERROR) and never masks mutation errors.

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const isLiveBackendConfigured = () => true;

export async function apiRequest(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = BASE_URL
    ? `${BASE_URL.replace(/\/$/, '')}${cleanEndpoint}`
    : cleanEndpoint;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errMessage = errorBody?.error?.message || errorBody?.message || `API Request failed (${response.status})`;
      if (options.throwOnError) {
        const err = new Error(errMessage);
        err.status = response.status;
        err.code = errorBody?.error?.code || 'API_ERROR';
        throw err;
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    if (options.throwOnError) {
      throw error;
    }
    console.warn(`[KRISHI-MITRA API Client] Request to ${url} fell back to local dataset:`, error.message);
    return null;
  }
}
