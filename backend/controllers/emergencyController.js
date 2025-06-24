// Emergency controller
const Emergency = require("../models/Emergency");




// @desc Get all emergencies
exports.getAllEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find().sort({ timestamp: -1 });
    res.status(200).json({ data: emergencies }); // ✅ Wrap in object
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const Ambulance = require("../models/Ambulance");
const Hospital = require("../models/Hospital");
exports.createEmergency = async (req, res) => {
  try {
    const emergency = new Emergency(req.body);
    await emergency.save();

    // ✅ Emit to clients
    const io = req.app.get("io");
    io.emit("incidentReported", {
      lat: emergency.location.lat,
      lng: emergency.location.lng,
      type: emergency.category,
      severity: emergency.priority,
      time: emergency.timestamp,
    });

    res.status(201).json(emergency);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.handleEmergency = async (req, res) => {
  const { patientLocation } = req.body;
  const io = req.app.get("io"); // Get socket.io instance

  try {
    // Get all available ambulances
    const availableAmbulances = await Ambulance.find({ status: "available" });

    if (!availableAmbulances.length) {
      return res.status(404).json({ message: "No ambulances available" });
    }

    // Find nearest ambulance
    const calculateDistance = (loc1, loc2) => {
      const dx = loc1.lat - loc2.lat;
      const dy = loc1.lng - loc2.lng;
      return Math.sqrt(dx * dx + dy * dy);
    };

    let nearestAmbulance = availableAmbulances[0];
    let minDistance = calculateDistance(availableAmbulances[0].currentLocation, patientLocation);

    for (let amb of availableAmbulances) {
      const dist = calculateDistance(amb.currentLocation, patientLocation);
      if (dist < minDistance) {
        minDistance = dist;
        nearestAmbulance = amb;
      }
    }

    // Mark ambulance as busy
    nearestAmbulance.status = "busy";
    await nearestAmbulance.save();

    // Broadcast to frontend via Socket.IO
    io.emit("ambulanceDispatched", {
      ambulance_id: nearestAmbulance.ambulance_id,
      driverName: nearestAmbulance.driverName,
      patientLocation,
    });

    res.status(200).json({
      message: "Ambulance dispatched successfully",
      ambulance: nearestAmbulance,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteAllEmergencies = async (req, res) => {
  try {
    await Emergency.deleteMany({});
    res.status(200).json({ message: "All emergencies have been deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmergencyStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "dispatched", "resolved"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const emergency = await Emergency.findById(id);
    if (!emergency) return res.status(404).json({ error: "Emergency not found" });

    emergency.status = status;
    await emergency.save();

    // Emit update via Socket.IO
    req.app.get("io").emit("emergency-status-updated", {
      emergencyId: emergency._id,
      newStatus: status,
    });

    res.json({ message: "Emergency status updated", emergency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
