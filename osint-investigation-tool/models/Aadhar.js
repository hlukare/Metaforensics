const mongoose = require('mongoose');

const AadharSchema = new mongoose.Schema({
  ref_id: String,
  status: String,
  message: String,
  care_of: String,
  address: String,
  dob: String,
  email: String,
  gender: String,
  name: String,
  year_of_birth: Number,
  mobile_hash: String,
  photo_link: String,
  share_code: String,
  xml_file: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

AadharSchema.index({ name: 1 });
AadharSchema.index({ ref_id: 1 });
AadharSchema.index({ dob: 1 });

module.exports = mongoose.model('Aadhar', AadharSchema);