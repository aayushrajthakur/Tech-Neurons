// Hospital schema
const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  hospital_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  specialties: [{ type: String }], // e.g., ['cardiology', 'trauma']
  load: { type: Number, default: 0 } // e.g., % of occupied beds
});

module.exports = mongoose.model("Hospital", hospitalSchema);
