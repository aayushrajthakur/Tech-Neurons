const Ambulance = require("../models/Ambulance");

const createAmbulance = async (req, res) => {
  try {
    const ambulance = new Ambulance(req.body);
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

  if (!["available", "busy"].includes(status)) {
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

module.exports = {
  createAmbulance,
  getAvailableAmbulances,
  updateLocation,
  updateStatus,
  getAmbulanceStatus
};
