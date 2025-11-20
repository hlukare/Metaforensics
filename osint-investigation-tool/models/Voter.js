const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema({
  reference_id: Number,
  verification_id: String,
  status: String,
  epic_number: String,
  name: String,
  name_in_regional_lang: String,
  age: String,
  relation_type: String,
  relation_name: String,
  relation_name_in_regional_lang: String,
  father_name: String,
  dob: String,
  gender: String,
  address: String,
  photo: String,
  split_address: {
    district: [String],
    state: [[String]],
    city: [String],
    pincode: String,
    country: [String],
    address_line: String
  },
  state: String,
  assembly_constituency_number: String,
  assembly_constituency: String,
  parliamentary_constituency_number: String,
  parliamentary_constituency: String,
  part_number: String,
  part_name: String,
  serial_number: String,
  polling_station: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

VoterSchema.index({ name: 1 });
VoterSchema.index({ dob: 1 });
VoterSchema.index({ father_name: 1 });

module.exports = mongoose.model('Voter', VoterSchema);