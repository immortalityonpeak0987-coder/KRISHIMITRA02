import mongoose from 'mongoose';

export const WEST_BENGAL_DISTRICTS = [
  'Purba Bardhaman',
  'Hooghly',
  'South 24 Parganas',
  'North 24 Parganas',
  'Nadia',
  'Murshidabad',
  'Purba Medinipur',
  'Paschim Medinipur',
  'Bankura',
  'Purulia',
  'Birbhum',
  'Malda',
  'Uttar Dinajpur',
  'Dakshin Dinajpur',
  'Jalpaiguri',
  'Alipurduar',
  'Cooch Behar',
  'Darjeeling',
  'Kalimpong',
  'Howrah',
  'Kolkata',
  'Jhargram',
  'Paschim Bardhaman'
];

const FarmSchema = new mongoose.Schema({
  farmerName: {
    type: String,
    trim: true,
    default: null
  },
  farmName: {
    type: String,
    required: [true, 'Farm name is required.'],
    trim: true
  },
  locationName: {
    type: String,
    required: [true, 'Location name is required.'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required.'],
    enum: {
      values: WEST_BENGAL_DISTRICTS,
      message: 'District must be one of the recognized 23 districts of West Bengal.'
    }
  },
  block: {
    type: String,
    trim: true,
    default: null
  },
  village: {
    type: String,
    trim: true,
    default: null
  },
  coordinates: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required.'],
      min: [-90, 'Latitude must be between -90 and 90 degrees.'],
      max: [90, 'Latitude must be between -90 and 90 degrees.']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required.'],
      min: [-180, 'Longitude must be between -180 and 180 degrees.'],
      max: [180, 'Longitude must be between -180 and 180 degrees.']
    }
  },
  area: {
    value: {
      type: Number,
      required: [true, 'Area value is required.'],
      min: [0.0001, 'Area value must be greater than zero.']
    },
    unit: {
      type: String,
      required: [true, 'Area unit is required.'],
      enum: {
        values: ['Bigha', 'Acre', 'Hectare'],
        message: 'Area unit must be Bigha, Acre, or Hectare.'
      }
    },
    areaInHectares: {
      type: Number,
      default: null
    },
    areaInAcres: {
      type: Number,
      default: null
    }
  },
  farmType: {
    type: String,
    trim: true,
    default: null
  },
  soilType: {
    type: String,
    trim: true,
    default: null // Explicitly optional; never inferred automatically from district name
  },
  irrigationType: {
    type: String,
    trim: true,
    default: null
  },
  currentCrop: {
    type: String,
    trim: true,
    default: null
  },
  previousCrops: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    trim: true,
    default: null
  },
  dataOrigin: {
    type: String,
    required: true,
    enum: ['USER_INPUT', 'DEMO'],
    default: 'USER_INPUT'
  },
  demoId: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
    default: undefined
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

// Conversion Helper: 1 Bengali standard Bigha is approximately 0.1338 hectares (~0.3306 Acres)
// Regional bigha definitions vary across Indian states. This conversion is calibrated for West Bengal.
FarmSchema.pre('validate', function() {
  if (this.area && this.area.value && this.area.unit) {
    const val = Number(this.area.value);
    if (!isNaN(val) && val > 0) {
      if (this.area.unit === 'Bigha') {
        this.area.areaInHectares = Number((val * 0.1338).toFixed(4));
        this.area.areaInAcres = Number((val * 0.3306).toFixed(4));
      } else if (this.area.unit === 'Acre') {
        this.area.areaInHectares = Number((val * 0.404686).toFixed(4));
        this.area.areaInAcres = Number(val.toFixed(4));
      } else if (this.area.unit === 'Hectare') {
        this.area.areaInHectares = Number(val.toFixed(4));
        this.area.areaInAcres = Number((val * 2.47105).toFixed(4));
      }
    }
  }
});

FarmSchema.index({ district: 1 });
FarmSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
FarmSchema.index({ dataOrigin: 1 });

export const Farm = mongoose.models.Farm || mongoose.model('Farm', FarmSchema);
export default Farm;
