// Ambulance schema
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
    enum: ["available", "busy"],
    default: "available"
  }
});

module.exports = mongoose.model("Ambulance", ambulanceSchema);
