const Emergency = require("../models/Emergency");
const Ambulance = require("../models/Ambulance");
const haversine = require("haversine-distance"); // npm install haversine-distance

exports.dispatchAmbulance = async (req, res) => {
  const { emergencyId } = req.params;

  try {
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: "Emergency not found" });
    }

    const ambulances = await Ambulance.find({ status: "available" });
    if (ambulances.length === 0) {
      return res.status(400).json({ error: "No available ambulances" });
    }

    // Find nearest ambulance
    let nearestAmbulance = null;
    let minDistance = Infinity;

    ambulances.forEach((ambulance) => {
      const distance = haversine(
        {
          lat: emergency.location.lat,
          lng: emergency.location.lng,
        },
        {
          lat: ambulance.currentLocation.lat,
          lng: ambulance.currentLocation.lng,
        }
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestAmbulance = ambulance;
      }
    });

    if (!nearestAmbulance) {
      return res.status(400).json({ error: "No nearby ambulance found" });
    }

    // Update status
    nearestAmbulance.status = "busy";
    await nearestAmbulance.save();

    emergency.status = "dispatched";
    await emergency.save();

    // Emit Socket.IO events
    const io = req.app.get("io");

    io.emit("ambulance-dispatched", {
      ambulanceId: nearestAmbulance._id,
      emergencyId: emergency._id,
      location: nearestAmbulance.currentLocation,
    });

    io.emit("emergency-status-updated", {
      emergencyId: emergency._id,
      newStatus: emergency.status,
    });

    io.emit("ambulance-status-updated", {
      ambulanceId: nearestAmbulance._id,
      newStatus: nearestAmbulance.status,
    });

    console.log("🚨 Dispatch events emitted via Socket.IO");

    res.json({
      message: "Ambulance dispatched successfully",
      ambulance: nearestAmbulance,
      emergency,
    });
  } catch (err) {
    console.error("❌ Error in dispatch:", err);
    res.status(500).json({ error: err.message });
  }
};
