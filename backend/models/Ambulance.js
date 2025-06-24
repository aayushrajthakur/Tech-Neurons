const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema({
  ambulance_id: { type: String, required: true, unique: true },
  driverName: { type: String, required: true },
  currentLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ["available", "busy", "dispatched", "transporting"],
    default: "available"
  },
  currentEmergency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Emergency"
  },
  destination: {
    type: {
      type: String, // e.g., 'emergency'
    },
    location: {
      lat: Number,
      lng: Number
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital"
    },
    hospitalLocation: {
      lat: Number,
      lng: Number
    }
  }
});

module.exports = mongoose.model("Ambulance", ambulanceSchema);
