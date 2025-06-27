// controllers/dispatchController.js
const moment = require('moment-timezone');
const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const Emergency = require("../models/Emergency");
const { getSocketInstance } = require('../socket/socketHandler');

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to estimate arrival time
const estimateArrivalTime = (distance, averageSpeed = 40) => {
  // Using 40 km/h as average speed considering city traffic and emergency conditions
  const hours = distance / averageSpeed;
  const minutes = Math.round(hours * 60);
  return new Date(Date.now() + minutes * 60000);
};

// Find best hospital based on proximity, capacity, and specialties
const findBestHospital = async (emergencyLocation, category = null, priority = "MEDIUM") => {
  const hospitals = await Hospital.find();
  if (hospitals.length === 0) throw new Error("No available hospitals found");

  const hospitalScores = hospitals.map(hospital => {
    const distance = calculateDistance(
      emergencyLocation.lat,
      emergencyLocation.lng,
      hospital.location.lat,
      hospital.location.lng
    );

    // Base score is distance
    let score = distance;

    // Add load penalty (higher load = higher score = less preferred)
    score += (hospital.load / 10);

    // Reduce score if hospital has relevant specialty
    if (category && hospital.specialties && hospital.specialties.length > 0) {
      const hasRelevantSpecialty = hospital.specialties.some(specialty =>
        specialty.toLowerCase().includes(category.toLowerCase()) ||
        (category.toLowerCase() === 'medical' &&
          ['emergency', 'trauma', 'cardiology', 'surgery'].includes(specialty.toLowerCase()))
      );
      if (hasRelevantSpecialty) {
        score -= 2; // Prefer hospitals with relevant specialties
      }
    }

    // Priority adjustments
    if (priority === "HIGH") {
      // For high priority, heavily weight distance over load
      score = distance * 1.5 + (hospital.load / 20);
    }

    return { hospital, distance, score };
  });

  hospitalScores.sort((a, b) => a.score - b.score);
  return hospitalScores[0];
};

// Find best available ambulance based on proximity and priority
const findBestAmbulance = async (emergencyLocation, priority = "MEDIUM") => {
  const availableAmbulances = await Ambulance.find({ status: "available" });
  if (availableAmbulances.length === 0) throw new Error("No available ambulances found");

  const ambulanceDistances = availableAmbulances.map(ambulance => {
    const distance = calculateDistance(
      emergencyLocation.lat,
      emergencyLocation.lng,
      ambulance.currentLocation.lat,
      ambulance.currentLocation.lng
    );
    return { ambulance, distance };
  });

  // For high priority emergencies, always choose the closest
  ambulanceDistances.sort((a, b) => a.distance - b.distance);

  // For high priority, return the closest
  // For medium/low priority, we could implement additional logic here
  return ambulanceDistances[0];
};

// Main dispatch function
exports.dispatchEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const io = getSocketInstance();

    // Find the emergency
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({
        success: false,
        error: "Emergency not found"
      });
    }

    if (emergency.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Emergency already dispatched or resolved"
      });
    }

    // Find best ambulance and hospital
    const bestAmbulance = await findBestAmbulance(emergency.location, emergency.priority);
    const bestHospital = await findBestHospital(emergency.location, emergency.category, emergency.priority);

    // Calculate distances and ETAs
    const ambulanceToEmergencyDistance = bestAmbulance.distance;
    const emergencyToHospitalDistance = calculateDistance(
      emergency.location.lat,
      emergency.location.lng,
      bestHospital.hospital.location.lat,
      bestHospital.hospital.location.lng
    );

    const etaToEmergency = estimateArrivalTime(ambulanceToEmergencyDistance);
    const etaToHospital = estimateArrivalTime(ambulanceToEmergencyDistance + emergencyToHospitalDistance);

    // Update ambulance
    const updatedAmbulance = await Ambulance.findByIdAndUpdate(
      bestAmbulance.ambulance._id,
      {
        status: "dispatched",
        currentEmergency: emergencyId,
        destination: {
          type: "emergency",
          location: {
            lat: emergency.location.lat,
            lng: emergency.location.lng
          },
          hospitalId: bestHospital.hospital._id,
          hospitalLocation: {
            lat: bestHospital.hospital.location.lat,
            lng: bestHospital.hospital.location.lng
          }
        }
      },
      { new: true }
    );

    // Update emergency
    const updatedEmergency = await Emergency.findByIdAndUpdate(
      emergencyId,
      {
        status: "dispatched",
        assignedAmbulance: bestAmbulance.ambulance._id
      },
      { new: true }
    );

    // Update hospital load
    await Hospital.findByIdAndUpdate(
      bestHospital.hospital._id,
      { $inc: { load: 1 } }
    );

    // Emit socket event for real-time updates
    if (io) {
      io.emit("dispatch:new", {
        emergencyId: updatedEmergency._id,
        ambulanceId: updatedAmbulance._id,
        hospitalId: bestHospital.hospital._id,
        status: "dispatched",
        etaToEmergency: etaToEmergency,
        etaToHospital: etaToHospital,
        dispatchTime: new Date(),
        distances: {
          ambulanceToEmergency: ambulanceToEmergencyDistance,
          emergencyToHospital: emergencyToHospitalDistance
        },
        emergency: {
          id: updatedEmergency._id,
          patientName: updatedEmergency.patientName,
          contactNumber: updatedEmergency.contactNumber,
          location: updatedEmergency.location,
          category: updatedEmergency.category,
          priority: updatedEmergency.priority,
          status: updatedEmergency.status,
          timestamp: updatedEmergency.timestamp
        },
        ambulance: {
          id: updatedAmbulance._id,
          ambulance_id: updatedAmbulance.ambulance_id,
          driverName: updatedAmbulance.driverName,
          currentLocation: updatedAmbulance.currentLocation,
          status: updatedAmbulance.status
        },
        hospital: {
          id: bestHospital.hospital._id,
          hospital_id: bestHospital.hospital.hospital_id,
          name: bestHospital.hospital.name,
          location: bestHospital.hospital.location,
          specialties: bestHospital.hospital.specialties,
          load: bestHospital.hospital.load
        }
      });
    }

    res.json({
      success: true,
      message: "Emergency dispatched successfully",
      data: {
        emergencyId: updatedEmergency._id,
        ambulanceId: updatedAmbulance._id,
        hospitalId: bestHospital.hospital._id,
        etaToEmergency: etaToEmergency,
        etaToHospital: etaToHospital,
        distances: {
          ambulanceToEmergency: Math.round(ambulanceToEmergencyDistance * 100) / 100,
          emergencyToHospital: Math.round(emergencyToHospitalDistance * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error("Dispatch error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all active dispatches
// Get all active dispatches
exports.getActiveDispatches = async (req, res) => {
  try {
    // Find all emergencies that are dispatched
    const activeEmergencies = await Emergency.find({
      status: "dispatched"
    })
      .populate({
        path: 'assignedAmbulance',
        model: 'Ambulance'
      })
      .sort({ timestamp: -1 });

    const dispatches = [];

    for (const emergency of activeEmergencies) {
      if (emergency.assignedAmbulance) {
        // Get hospital info from ambulance destination
        let hospital = null;
        if (emergency.assignedAmbulance.destination?.hospitalId) {
          hospital = await Hospital.findById(emergency.assignedAmbulance.destination.hospitalId);
        }

        dispatches.push({
          emergencyId: emergency._id, // main reference
          status: emergency.status,
          dispatchTime: emergency.timestamp,

          emergency: {
            _id: emergency._id,
            id: emergency._id,
            patientName: emergency.patientName,
            contactNumber: emergency.contactNumber,
            location: emergency.location,
            category: emergency.category,
            priority: emergency.priority,
            status: emergency.status,
            timestamp: emergency.timestamp
          },

          ambulance: {
            _id: emergency.assignedAmbulance._id,
            id: emergency.assignedAmbulance._id,
            ambulance_id: emergency.assignedAmbulance.ambulance_id,
            driverName: emergency.assignedAmbulance.driverName,
            currentLocation: emergency.assignedAmbulance.currentLocation,
            status: emergency.assignedAmbulance.status
          },

          hospital: hospital ? {
            _id: hospital._id,
            id: hospital._id,
            hospital_id: hospital.hospital_id,
            name: hospital.name,
            location: hospital.location,
            specialties: hospital.specialties,
            load: hospital.load
          } : null
        });
      }
    }

    res.json({
      success: true,
      count: dispatches.length,
      dispatches
    });

  } catch (error) {
    console.error("Get active dispatches error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update ambulance location (for real-time tracking)
exports.updateAmbulanceLocation = async (req, res) => {
  try {
    const { ambulanceId } = req.params;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "Latitude (lat) and longitude (lng) are required"
      });
    }

    const ambulance = await Ambulance.findByIdAndUpdate(
      ambulanceId,
      {
        currentLocation: { lat: parseFloat(lat), lng: parseFloat(lng) }
      },
      { new: true }
    );

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        error: "Ambulance not found"
      });
    }

    // Emit real-time location update
    const io = getSocketInstance();
    if (io) {
      io.emit("ambulance:location-update", {
        ambulanceId: ambulance._id,
        ambulance_id: ambulance.ambulance_id,
        currentLocation: ambulance.currentLocation,
        status: ambulance.status,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "Location updated successfully",
      ambulance: {
        id: ambulance._id,
        ambulance_id: ambulance.ambulance_id,
        currentLocation: ambulance.currentLocation,
        status: ambulance.status
      }
    });

  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark ambulance as arrived at emergency location
exports.markArrivedAtEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const emergency = await Emergency.findById(emergencyId)
      .populate({
        path: 'assignedAmbulance',
        model: 'Ambulance'
      });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        error: "Emergency not found"
      });
    }

    if (emergency.status !== "dispatched") {
      return res.status(400).json({
        success: false,
        error: "Emergency is not in dispatched status"
      });
    }

    // Update ambulance status to busy (at emergency location)
    await Ambulance.findByIdAndUpdate(
      emergency.assignedAmbulance._id,
      { status: "busy" }
    );

    await Emergency.findByIdAndUpdate(
      emergency._id,
      { status: "arrived_at_emergency" }
    );

    const io = getSocketInstance();
    if (io) {
      io.emit("ambulance:arrived-emergency", {
        emergencyId: emergency._id,
        ambulanceId: emergency.assignedAmbulance._id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "Marked as arrived at emergency location"
    });

  } catch (error) {
    console.error("Mark arrived at emergency error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark ambulance as transporting patient to hospital
exports.markTransporting = async (req, res) => {
  const { emergencyId } = req.params;

  try {
    const emergency = await Emergency.findById(emergencyId).populate('assignedAmbulance');

    if (!emergency) {
      return res.status(404).json({ success: false, message: "Emergency not found" });
    }

    const ambulance = emergency.assignedAmbulance;

    if (!ambulance) {
      return res.status(400).json({ success: false, message: "Ambulance not assigned" });
    }

    // ✅ Update ambulance status
    await Ambulance.findByIdAndUpdate(ambulance._id, { status: "transporting" });

    // ✅ Update emergency status
    await Emergency.findByIdAndUpdate(emergencyId, { status: "transporting" });

    const io = getSocketInstance();
    if (io) {
      io.emit('emergency:updated', {
        ...emergency.toObject(),
        status: 'transporting'
      });

      io.emit('ambulance:transporting', {
        emergencyId,
        ambulanceId: ambulance._id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Marked as transporting',
      data: {
        emergencyId,
        ambulanceId: ambulance._id,
        status: 'transporting'
      }
    });

  } catch (error) {
    console.error('Transporting error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markArrivedAtHospital = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const emergency = await Emergency.findById(emergencyId).populate('assignedAmbulance');
    if (!emergency) {
      return res.status(404).json({ success: false, error: "Emergency not found" });
    }

    // Update ambulance status to busy/at hospital
    await Ambulance.findByIdAndUpdate(emergency.assignedAmbulance._id, {
      status: "arrived_at_hospital"
    });

    // Update emergency status
    await Emergency.findByIdAndUpdate(emergencyId, {
      status: "arrived_at_hospital"
    });

    const io = getSocketInstance();
    if (io) {
      io.emit("ambulance:arrived-hospital", {
        emergencyId,
        ambulanceId: emergency.assignedAmbulance._id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "Ambulance arrived at hospital"
    });
  } catch (error) {
    console.error("Mark arrived at hospital error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// Complete emergency (arrived at hospital)
exports.completeEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const emergency = await Emergency.findById(emergencyId)
      .populate({
        path: 'assignedAmbulance',
        model: 'Ambulance'
      });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        error: "Emergency not found"
      });
    }

    // Update emergency status to resolved
    const updatedEmergency = await Emergency.findByIdAndUpdate(
      emergencyId,
      { status: "resolved" },
      { new: true }
    );

    // Update ambulance status back to available and clear assignments
    await Ambulance.findByIdAndUpdate(
      emergency.assignedAmbulance._id,
      {
        status: "available",
        currentEmergency: null,
        destination: {}
      }
    );

    // Decrease hospital load
    if (emergency.assignedAmbulance.destination && emergency.assignedAmbulance.destination.hospitalId) {
      await Hospital.findByIdAndUpdate(
        emergency.assignedAmbulance.destination.hospitalId,
        { $inc: { load: -1 } }
      );
    }

    const io = getSocketInstance();
    if (io) {
      io.emit("emergency:completed", {
        emergencyId: emergency._id,
        ambulanceId: emergency.assignedAmbulance._id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "Emergency completed successfully",
      emergency: updatedEmergency
    });

  } catch (error) {
    console.error("Complete emergency error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get dispatch statistics
exports.getDispatchStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmergencies = await Emergency.countDocuments();
    const pendingEmergencies = await Emergency.countDocuments({ status: "pending" });
    const activeDispatches = await Emergency.countDocuments({ status: "dispatched" });
    //const resolvedToday = await Emergency.countDocuments({ status: "resolved", timestamp: { $gte: today } });
    const startOfDayIST = moment.tz('Asia/Kolkata').startOf('day').toDate();

    const completedToday = await Emergency.countDocuments({
      status: 'resolved',
      timestamp: { $gte: startOfDayIST }
    });
    //console.error("completed resolved:",completedToday);
    const totalAmbulances = await Ambulance.countDocuments();
    const availableAmbulances = await Ambulance.countDocuments({ status: "available" });
    const busyAmbulances = await Ambulance.countDocuments({ status: { $in: ["dispatched", "busy", "transporting"] } });

    const totalHospitals = await Hospital.countDocuments();
    const averageHospitalLoad = await calculateAverageHospitalLoad();
    const emergencyBreakdown = await getEmergencyBreakdown();

    res.json({
      success: true,
      stats: {
        totalEmergencies,
        pendingEmergencies,
        activeDispatches,
        completedToday,
        totalAmbulances,
        availableAmbulances,
        busyAmbulances,
        totalHospitals,
        averageHospitalLoad,
        emergencyBreakdown
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// Helper function to calculate average hospital load
const calculateAverageHospitalLoad = async () => {
  try {
    const hospitals = await Hospital.find({}, 'load');
    if (hospitals.length === 0) return 0;

    const totalLoad = hospitals.reduce((sum, hospital) => sum + hospital.load, 0);
    return Math.round((totalLoad / hospitals.length) * 100) / 100;
  } catch (error) {
    console.error("Calculate hospital load error:", error);
    return 0;
  }
};

// Helper function to get emergency breakdown by category and priority
const getEmergencyBreakdown = async () => {
  try {
    const categoryBreakdown = await Emergency.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const priorityBreakdown = await Emergency.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const statusBreakdown = await Emergency.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      byCategory: categoryBreakdown,
      byPriority: priorityBreakdown,
      byStatus: statusBreakdown
    };
  } catch (error) {
    console.error("Get emergency breakdown error:", error);
    return {
      byCategory: [],
      byPriority: [],
      byStatus: []
    };
  }
};

// Get emergency details with full dispatch info
exports.getEmergencyDetails = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    const emergency = await Emergency.findById(emergencyId)
      .populate({
        path: 'assignedAmbulance',
        model: 'Ambulance'
      });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        error: "Emergency not found"
      });
    }

    let hospital = null;
    if (emergency.assignedAmbulance &&
      emergency.assignedAmbulance.destination &&
      emergency.assignedAmbulance.destination.hospitalId) {
      hospital = await Hospital.findById(emergency.assignedAmbulance.destination.hospitalId);
    }

    const response = {
      success: true,
      emergency: {
        id: emergency._id,
        patientName: emergency.patientName,
        contactNumber: emergency.contactNumber,
        location: emergency.location,
        category: emergency.category,
        priority: emergency.priority,
        status: emergency.status,
        timestamp: emergency.timestamp
      },
      ambulance: emergency.assignedAmbulance ? {
        id: emergency.assignedAmbulance._id,
        ambulance_id: emergency.assignedAmbulance.ambulance_id,
        driverName: emergency.assignedAmbulance.driverName,
        currentLocation: emergency.assignedAmbulance.currentLocation,
        status: emergency.assignedAmbulance.status,
        destination: emergency.assignedAmbulance.destination
      } : null,
      hospital: hospital ? {
        id: hospital._id,
        hospital_id: hospital.hospital_id,
        name: hospital.name,
        location: hospital.location,
        specialties: hospital.specialties,
        load: hospital.load
      } : null
    };

    res.json(response);

  } catch (error) {
    console.error("Get emergency details error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};