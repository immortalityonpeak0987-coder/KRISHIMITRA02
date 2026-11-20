import mongoose from 'mongoose';

const ApiCacheSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: [true, 'Cache key is required.'],
    unique: true,
    trim: true,
    index: true
  },
  source: {
    type: String,
    required: [true, 'API source is required.'],
    enum: {
      values: ['NASA_POWER', 'NASA_GPM', 'NASA_SMAP', 'NASA_MODIS', 'NASA_APPEEARS', 'NASA_CMR', 'IMD', 'SOILGRIDS', 'GOOGLE_EARTH_ENGINE'],
      message: 'Invalid cache source provider.'
    }
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Query parameters are required for cached payload.']
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Response data payload is required.']
  },
  fetchedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required for cache lifecycle.']
  },
  status: {
    type: String,
    enum: ['VALID', 'EXPIRED', 'STALE'],
    default: 'VALID'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// TTL index to automatically purge expired cache documents from MongoDB
ApiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ApiCacheSchema.index({ source: 1, fetchedAt: -1 });

export const ApiCache = mongoose.models.ApiCache || mongoose.model('ApiCache', ApiCacheSchema);
export default ApiCache;
