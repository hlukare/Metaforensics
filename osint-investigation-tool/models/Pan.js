const mongoose = require('mongoose');

const PanSchema = new mongoose.Schema({
  pan_number: String,
  name: String,
  dob: String,
  father_name: String,
  date_of_issue: String,
  photo_link: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

PanSchema.index({ name: 1 });
PanSchema.index({ pan_number: 1 });
PanSchema.index({ dob: 1 });

module.exports = mongoose.model('Pan', PanSchema);