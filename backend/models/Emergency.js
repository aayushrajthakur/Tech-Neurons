// Emergency schema
const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
  patientName: { type: String, default: "Unknown" },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  priority: {
    type: String,
    enum: ["HIGH", "MEDIUM", "LOW"],
    required: true
  },
  category: { type: String, required: true }, // medical, fire, etc.
  status: {
    type: String,
    enum: ["pending", "dispatched", "resolved"],
    default: "pending"
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Emergency", emergencySchema);
