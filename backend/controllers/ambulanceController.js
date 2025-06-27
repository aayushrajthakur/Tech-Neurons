//ambulanceController.js
const Ambulance = require("../models/Ambulance");
const { emitAmbulanceUpdate } = require("../socket/socketHandler");

const createAmbulance = async (req, res) => {
  try {
    const { ambulance_id, currentLocation, status } = req.body;

    const ambulance = new Ambulance({
      ambulance_id,
      status,
      currentLocation: {
        lat: parseFloat(currentLocation.lat),
        lng: parseFloat(currentLocation.lng)
      }
    });

    await ambulance.save();
    res.status(201).json(ambulance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


const getAvailableAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find({ status: "available" });
    res.status(200).json(ambulances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { lat, lng } = req.body;

  try {
    const ambulance = await Ambulance.findById(id);
    if (!ambulance) return res.status(404).json({ error: "Ambulance not found" });

    ambulance.currentLocation = { lat, lng };
    await ambulance.save();

    // Emit location update
    req.app.get("io").emit("ambulance-location-updated", {
      ambulanceId: ambulance._id,
      location: ambulance.currentLocation
    });

    res.json({ message: "Location updated", ambulance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

 if (!["available", "busy", "dispatched", "transporting", "arrived_at_emergency"].includes(status)) {
  return res.status(400).json({ error: "Invalid status value" });
}


  try {
    const ambulance = await Ambulance.findById(id);
    if (!ambulance) return res.status(404).json({ error: "Ambulance not found" });

    ambulance.status = status;
    await ambulance.save();

    // Emit status update
    req.app.get("io").emit("ambulance-status-updated", {
      ambulanceId: ambulance._id,
      newStatus: ambulance.status,
    });

    res.json({ message: "Status updated", ambulance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAmbulanceStatus = async (req, res) => {
  try {
    const ambulances = await Ambulance.find();
    res.json(ambulances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Fixed: Define as const function instead of exports.functionName
const updateAmbulanceLocation = async (req, res) => {
  const { ambulance_id, lat, lng, status } = req.body;

  try {
    const updated = await Ambulance.findOneAndUpdate(
      { ambulance_id },
      {
        $set: {
          currentLocation: { lat, lng },
          status,
        },
      },
      { new: true }
    );

    emitAmbulanceUpdate(updated); // 📡 Emit to frontend

    res.json({ message: "Location updated", updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Now all functions are properly defined and can be exported
module.exports = {
  createAmbulance,
  getAvailableAmbulances,
  updateLocation,
  updateStatus,
  getAmbulanceStatus,
  updateAmbulanceLocation
};