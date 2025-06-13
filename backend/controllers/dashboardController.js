// controllers/dashboardController.js

const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const Emergency = require("../models/Emergency");

exports.getFullDashboardSummary = async (req, res) => {
  try {
    // Hospital stats
    const totalHospitals = await Hospital.countDocuments();
    const hospitalLoads = await Hospital.find({}, "load");
    const avgHospitalLoad = hospitalLoads.reduce((sum, h) => sum + h.load, 0) / (hospitalLoads.length || 1);

    // Ambulance stats
    const totalAmbulances = await Ambulance.countDocuments();
    const availableAmbulances = await Ambulance.countDocuments({ status: "available" });
    const busyAmbulances = totalAmbulances - availableAmbulances;

    // Emergency stats
    const totalEmergencies = await Emergency.countDocuments();
    const pendingEmergencies = await Emergency.countDocuments({ status: "pending" });
    const dispatchedEmergencies = await Emergency.countDocuments({ status: "dispatched" });
    const resolvedEmergencies = await Emergency.countDocuments({ status: "resolved" });

    // Combine response
    res.json({
      hospitals: {
        totalHospitals,
        avgHospitalLoad: Math.round(avgHospitalLoad),
      },
      ambulances: {
        totalAmbulances,
        availableAmbulances,
        busyAmbulances,
      },
      emergencies: {
        totalEmergencies,
        pending: pendingEmergencies,
        dispatched: dispatchedEmergencies,
        resolved: resolvedEmergencies,
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
