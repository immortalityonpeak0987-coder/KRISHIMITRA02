import mongoose from 'mongoose';

const CropSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: [true, 'Crop name is required.'],
    trim: true,
    index: true
  },
  scientificName: {
    type: String,
    trim: true,
    default: null
  },
  cropCategory: {
    type: String,
    required: [true, 'Crop category is required.'],
    enum: {
      values: ['Cereal', 'Pulse', 'Oilseed', 'Fiber', 'Tuber', 'Vegetable', 'Fruit', 'Fodder', 'Green_Manure'],
      message: 'Invalid crop category.'
    }
  },
  suitableSeasons: {
    type: [{
      type: String,
      enum: ['Kharif', 'Rabi', 'Zaid', 'Pre-Kharif', 'Year-Round']
    }],
    required: [true, 'At least one suitable season is required.']
  },
  suitableSoilTypes: {
    type: [String],
    default: []
  },
  waterRequirement: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Very High'],
    default: null
  },
  // Scientific salinity tolerance: remains null unless backed by traceable published research
  salinityTolerance: {
    thresholdECe: {
      type: Number,
      default: null // Electrical conductivity threshold in dS/m
    },
    rating: {
      type: String,
      enum: ['Sensitive', 'Moderately Sensitive', 'Moderately Tolerant', 'Tolerant', 'Unspecified'],
      default: 'Unspecified'
    },
    citation: {
      type: String,
      default: null
    }
  },
  // Temperature range: remains null unless backed by traceable published research
  temperatureRange: {
    minCelsius: {
      type: Number,
      default: null
    },
    optimalCelsius: {
      type: Number,
      default: null
    },
    maxCelsius: {
      type: Number,
      default: null
    },
    citation: {
      type: String,
      default: null
    }
  },
  source: {
    type: String,
    trim: true,
    default: 'West Bengal Crop Planning Calendar & ICAR'
  },
  dataOrigin: {
    type: String,
    required: true,
    enum: ['RESEARCH_VERIFIED', 'DEMO'],
    default: 'RESEARCH_VERIFIED'
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

CropSchema.index({ cropCategory: 1 });
CropSchema.index({ dataOrigin: 1 });

export const Crop = mongoose.models.Crop || mongoose.model('Crop', CropSchema);
export default Crop;
