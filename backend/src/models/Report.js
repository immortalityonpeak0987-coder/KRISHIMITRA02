import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm reference is required for report metadata.']
  },
  reportType: {
    type: String,
    required: [true, 'Report type is required.'],
    enum: {
      values: ['RESILIENCE_AUDIT', 'SEASONAL_BRIEF', 'SOIL_HEALTH', 'RECOVERY_ASSESSMENT'],
      message: 'Invalid report type.'
    }
  },
  title: {
    type: String,
    required: [true, 'Report title is required.'],
    trim: true
  },
  generatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['GENERATED', 'PENDING', 'FAILED'],
    default: 'GENERATED'
  },
  format: {
    type: String,
    required: true,
    enum: ['JSON', 'PDF', 'CSV'],
    default: 'JSON'
  },
  storageProvider: {
    type: String,
    enum: ['LOCAL', 'S3', 'NONE'],
    default: 'NONE'
  },
  storageKey: {
    type: String,
    trim: true,
    default: null
  },
  sourceDataReferences: {
    type: [String],
    default: []
  },
  dataOrigin: {
    type: String,
    required: true,
    enum: ['SYSTEM_GENERATED', 'DEMO'],
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

ReportSchema.index({ farm: 1, generatedAt: -1 });
ReportSchema.index({ dataOrigin: 1 });

export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export default Report;
