import mongoose from 'mongoose';

export const SATELLITE_PARAMETERS = [
  'RAINFALL_ACCUMULATION',
  'SURFACE_TEMPERATURE',
  'SOIL_MOISTURE',
  'NDVI',
  'RELATIVE_HUMIDITY',
  'SOLAR_RADIATION',
  'WIND_SPEED',
  'FLOOD_INUNDATION_EXTENT',
  'SURFACE_REFLECTANCE'
];

export const SATELLITE_TASK_STATUS = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CATALOG_ONLY'
];

const SatelliteDataAssetSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    default: null
  },
  dataset: {
    type: String,
    required: [true, 'Satellite dataset designation is required.'],
    trim: true
  },
  productId: {
    type: String,
    required: [true, 'NASA product identifier is required.'],
    trim: true
  },
  productVersion: {
    type: String,
    required: [true, 'Product version is required.'],
    trim: true
  },
  instrument: {
    type: String,
    trim: true,
    default: null
  },
  parameter: {
    type: String,
    required: [true, 'Environmental parameter type is required.'],
    enum: {
      values: SATELLITE_PARAMETERS,
      message: 'Parameter must be one of the recognized satellite environmental indicators.'
    }
  },
  layer: {
    type: String,
    required: [true, 'Specific product layer name is required.'],
    trim: true
  },
  spatialResolution: {
    type: String,
    trim: true,
    default: null
  },
  temporalResolution: {
    type: String,
    trim: true,
    default: null
  },
  observationPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Observation period start date is required.']
    },
    endDate: {
      type: Date,
      required: [true, 'Observation period end date is required.']
    }
  },
  geographicArea: {
    type: {
      type: String,
      enum: ['Point', 'Polygon', 'BoundingBox'],
      default: 'Point'
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    isSubPixelObservation: {
      type: Boolean,
      default: false
    },
    effectivePixelAreaHectares: {
      type: Number,
      default: null
    }
  },
  taskId: {
    type: String,
    trim: true,
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: {
      values: SATELLITE_TASK_STATUS,
      message: 'Invalid satellite task processing status.'
    },
    default: 'COMPLETED'
  },
  qualityInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  outputFiles: [
    {
      fileId: { type: String, trim: true },
      fileName: { type: String, trim: true },
      fileSize: { type: Number },
      fileType: { type: String, trim: true },
      storageReference: { type: String, trim: true },
      sha256: { type: String, trim: true }
    }
  ],
  extractedValues: [
    {
      date: { type: Date, required: true },
      rawVal: { type: Number, default: null },
      scaledVal: { type: Number, default: null },
      unit: { type: String, trim: true },
      qualityFlag: { type: String, default: 'NOMINAL' }
    }
  ],
  sourceUrl: {
    type: String,
    trim: true,
    default: null
  },
  dataOrigin: {
    type: String,
    required: true,
    enum: ['OBSERVED', 'MODEL_ESTIMATE', 'SATELLITE_OBSERVED', 'SATELLITE_DERIVED'],
    default: 'SATELLITE_DERIVED'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

SatelliteDataAssetSchema.index({ farm: 1, parameter: 1, 'observationPeriod.startDate': -1 });
SatelliteDataAssetSchema.index({ productId: 1, productVersion: 1, layer: 1 });
SatelliteDataAssetSchema.index({ status: 1 });

export const SatelliteDataAsset = mongoose.models.SatelliteDataAsset || mongoose.model('SatelliteDataAsset', SatelliteDataAssetSchema);
export default SatelliteDataAsset;
