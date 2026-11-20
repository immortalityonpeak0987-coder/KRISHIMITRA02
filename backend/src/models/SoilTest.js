import mongoose from 'mongoose';

const SoilTestSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm reference is required for soil test record.']
  },
  testDate: {
    type: Date,
    required: [true, 'Test date is required.']
  },
  laboratoryName: {
    type: String,
    required: [true, 'Laboratory name is required.'],
    trim: true
  },
  laboratoryReference: {
    type: String,
    trim: true,
    default: null
  },
  // Electrical Conductivity (ECe) measurement: required if record represents a salinity test
  electricalConductivity: {
    value: {
      type: Number,
      required: [true, 'Electrical conductivity value is required.'],
      min: [0, 'EC value cannot be negative.']
    },
    unit: {
      type: String,
      required: true,
      default: 'dS/m'
    }
  },
  pH: {
    type: Number,
    min: [0, 'pH cannot be less than 0.'],
    max: [14, 'pH cannot be greater than 14.'],
    default: null
  },
  organicCarbonPercent: {
    type: Number,
    min: [0, 'Organic carbon cannot be less than 0%.'],
    max: [100, 'Organic carbon cannot be greater than 100%.'],
    default: null
  },
  soilTexture: {
    type: String,
    trim: true,
    default: null
  },
  additionalParameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Scientific rule: isVerifiedLab defaults strictly to false; never verify automatically
  isVerifiedLab: {
    type: Boolean,
    default: false
  },
  verificationDetails: {
    type: String,
    trim: true,
    default: null
  },
  sourceDocumentReference: {
    type: String,
    trim: true,
    default: null
  },
  dataOrigin: {
    type: String,
    required: true,
    enum: ['LAB_RECORD', 'DEMO'],
    default: 'DEMO'
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

SoilTestSchema.index({ farm: 1, testDate: -1 });
SoilTestSchema.index({ dataOrigin: 1 });

export const SoilTest = mongoose.models.SoilTest || mongoose.model('SoilTest', SoilTestSchema);
export default SoilTest;
