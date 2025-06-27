const mongoose = require("mongoose");
const emergencySchema = new mongoose.Schema({
  patientName: { type: String, default: "Unknown" },

  contactNumber: { 
    type: String, 
    required: true, 
    match: /^[6-9]\d{9}$/ 
  },

  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  priority: {
    type: String,
    enum: ["HIGH", "MEDIUM", "LOW"],
    required: true
  },

  category: { type: String, required: true },

  status: {
    type: String,
    enum: [
      "pending",
      "dispatched",
      "arrived_at_emergency",
      "transporting",
      "arrived_at_hospital",
      "resolved"
    ],
    default: "pending"
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  assignedAmbulance: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ambulance' 
  }
});
module.exports = mongoose.model("Emergency", emergencySchema);