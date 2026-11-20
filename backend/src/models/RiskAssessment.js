import mongoose from 'mongoose';

const RiskAssessmentSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm reference is required for risk assessment.']
  },
  riskType: {
    type: String,
    required: [true, 'Risk type is required.'],
    enum: {
      values: ['FLOOD_WATERLOGGING', 'COASTAL_SALINITY', 'HEAT_STRESS', 'DRY_SPELL', 'OVERALL_COMPOSITE'],
      message: 'Invalid risk type.'
    }
  },
  riskLevel: {
    type: String,
    required: [true, 'Risk level is required.'],
    enum: {
      values: ['LOW', 'MODERATE', 'HIGH', 'SEVERE', 'INDETERMINATE'],
      message: 'Risk level must be LOW, MODERATE, HIGH, SEVERE, or INDETERMINATE.'
    }
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be less than 0.'],
    max: [100, 'Score cannot be greater than 100.'],
    default: null // Explicitly null by default; never fabricate artificial scores
  },
  assessmentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  contributingFactors: {
    type: [String],
    default: []
  },
  inputObservationIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnvironmentalObservation'
  }],
  methodologyVersion: {
    type: String,
    required: true,
    default: 'v1.0-deterministic-baseline'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUPERSEDED', 'PENDING_DATA'],
    default: 'ACTIVE'
  },
  limitations: {
    type: String,
    trim: true,
    default: null
  },
  dataOrigin: {
    type: String,
    required: true,
    enum: ['CALCULATED', 'DEMO'],
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

RiskAssessmentSchema.index({ farm: 1, assessmentDate: -1 });
RiskAssessmentSchema.index({ riskType: 1 });
RiskAssessmentSchema.index({ dataOrigin: 1 });

export const RiskAssessment = mongoose.models.RiskAssessment || mongoose.model('RiskAssessment', RiskAssessmentSchema);
export default RiskAssessment;
