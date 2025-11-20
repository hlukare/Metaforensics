const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  main_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  reports: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: false // Allow flexible schema for dynamic report data
});

// Index for faster queries
ReportSchema.index({ main_id: 1 });
ReportSchema.index({ last_updated: -1 });
ReportSchema.index({ created_at: -1 });

module.exports = mongoose.model('Report', ReportSchema);
