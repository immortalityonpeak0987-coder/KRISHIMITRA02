import mongoose from 'mongoose';

const EvidenceReferenceSchema = new mongoose.Schema({
  url: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const RecoveryRecordSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm reference is required for recovery record.']
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required.']
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required.'],
    enum: {
      values: ['BASELINE', 'STRESS_EVENT', 'FIELD_EVIDENCE', 'RECOVERY_OBSERVATION', 'INTERVENTION', 'HARVEST_AUDIT'],
      message: 'Invalid event type.'
    }
  },
  title: {
    type: String,
    required: [true, 'Record title is required.'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Record description is required.'],
    trim: true
  },
  recoveryStatus: {
    type: String,
    required: [true, 'Recovery status is required.'],
    enum: {
      values: ['AFFECTED', 'RECOVERING', 'NORMALIZED', 'REPLANTED', 'INDETERMINATE'],
      message: 'Invalid recovery status.'
    }
  },
  // Scientific rule: recoveryScore defaults to null; never fabricate recovery percentages
  recoveryScore: {
    type: Number,
    min: [0, 'Recovery score cannot be less than 0.'],
    max: [100, 'Recovery score cannot be greater than 100.'],
    default: null
  },
  evidenceReferences: {
    type: [EvidenceReferenceSchema],
    default: []
  },
  source: {
    type: String,
    trim: true,
    default: 'Farmer Field Observation'
  },
  dataOrigin: {
    type: String,
    required: true,
    enum: ['USER_REPORTED', 'EXTENSION_OFFICER', 'DEMO'],
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

RecoveryRecordSchema.index({ farm: 1, eventDate: -1 });
RecoveryRecordSchema.index({ dataOrigin: 1 });

export const RecoveryRecord = mongoose.models.RecoveryRecord || mongoose.model('RecoveryRecord', RecoveryRecordSchema);
export default RecoveryRecord;
