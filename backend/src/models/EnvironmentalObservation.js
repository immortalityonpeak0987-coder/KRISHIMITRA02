import mongoose from 'mongoose';

export const ENVIRONMENTAL_PARAMETERS = [
  'RAINFALL_ACCUMULATION',
  'SURFACE_TEMPERATURE',
  'SOIL_MOISTURE',
  'NDVI',
  'RELATIVE_HUMIDITY',
  'SOLAR_RADIATION',
  'WIND_SPEED',
  'FLOOD_INUNDATION_EXTENT'
];

const EnvironmentalObservationSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm reference is required for environmental observation.']
  },
  parameter: {
    type: String,
    required: [true, 'Environmental parameter is required.'],
    enum: {
      values: ENVIRONMENTAL_PARAMETERS,
      message: 'Parameter must be one of the recognized environmental observation types.'
    }
  },
  // Scientific rule: missing data MUST be stored as null, never coerced to zero.
  value: {
    type: Number,
    default: null
  },
  unit: {
    type: String,
    required: [true, 'Observation unit is required.']
  },
  sourceName: {
    type: String,
    required: [true, 'Observation source name is required.'],
    trim: true
  },
  sourceProduct: {
    type: String,
    trim: true,
    default: null
  },
  observationDate: {
    type: Date,
    required: [true, 'Observation date is required.']
  },
  retrievalDate: {
    type: Date,
    required: true,
    default: Date.now
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
  qualityFlag: {
    type: String,
    enum: ['NOMINAL', 'DEGRADED', 'SUSPECT', 'ESTIMATED', 'MISSING'],
    default: 'NOMINAL'
  },
  uncertainty: {
    type: Number,
    default: null
  },
  dataOrigin: {
    type: String,
    required: [true, 'Data origin designation is required.'],
    enum: ['OBSERVED', 'MODEL_ESTIMATE', 'FORECAST', 'USER_REPORTED', 'DEMO']
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

EnvironmentalObservationSchema.index({ farm: 1, parameter: 1, observationDate: -1 });
EnvironmentalObservationSchema.index({ dataOrigin: 1 });

export const EnvironmentalObservation = mongoose.models.EnvironmentalObservation || mongoose.model('EnvironmentalObservation', EnvironmentalObservationSchema);
export default EnvironmentalObservation;
