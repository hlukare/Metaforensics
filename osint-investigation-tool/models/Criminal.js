const mongoose = require('mongoose');

const CriminalSchema = new mongoose.Schema({
  name: String,
  dob: String,
  father_name: String,
  address: String,
  case_details: [{
    case_number: String,
    filing_date: String,
    status: String,
    charges: [String],
    court: String,
    judgment: String,
    sentence: String
  }],
  photo_link: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

CriminalSchema.index({ name: 1 });
CriminalSchema.index({ dob: 1 });
CriminalSchema.index({ 'case_details.case_number': 1 });

module.exports = mongoose.model('Criminal', CriminalSchema);