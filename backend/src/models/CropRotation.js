import mongoose from 'mongoose';

const MonthlyPlanEntrySchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  cropName: {
    type: String,
    required: [true, 'Crop name is required for rotation month entry.'],
    trim: true
  },
  stage: {
    type: String,
    trim: true,
    default: null
  },
  sowingDate: {
    type: Date,
    default: null
  },
  harvestingDate: {
    type: Date,
    default: null
  },
  irrigationNotes: {
    type: String,
    trim: true,
    default: null
  }
}, { _id: false });

const CropRotationSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm reference is required for crop rotation.']
  },
  year: {
    type: Number,
    required: [true, 'Rotation plan year is required.'],
    min: [2000, 'Year must be 2000 or later.'],
    max: [2100, 'Year must be 2100 or earlier.']
  },
  monthlyPlan: {
    type: [MonthlyPlanEntrySchema],
    required: [true, 'Monthly rotation plan is required.'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0 && v.length <= 12;
      },
      message: 'Monthly plan must contain between 1 and 12 monthly entries.'
    }
  },
  source: {
    type: String,
    trim: true,
    default: 'Farmer Field Plan'
  },
  dataOrigin: {
    type: String,
    required: true,
    enum: ['USER_INPUT', 'DEMO'],
    default: 'USER_INPUT'
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

CropRotationSchema.index({ farm: 1, year: 1 });
CropRotationSchema.index({ dataOrigin: 1 });

export const CropRotation = mongoose.models.CropRotation || mongoose.model('CropRotation', CropRotationSchema);
export default CropRotation;
