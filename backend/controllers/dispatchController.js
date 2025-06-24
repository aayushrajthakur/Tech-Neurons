const Emergency = require("../models/Emergency");
const Ambulance = require("../models/Ambulance");
const Hospital = require("../models/Hospital");
const { calculateETA } = require("../utils/calculateETA");
const { getSocketInstance } = require('../socket/socketHandler');

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find the nearest available ambulance
const findNearestAmbulance = async (location) => {
  const ambulances = await Ambulance.find({ status: 'available' });
  if (ambulances.length === 0) throw new Error('No available ambulances');

  let nearest = null;
  let minDistance = Infinity;

  ambulances.forEach(amb => {
    const dist = calculateDistance(location.lat, location.lng, amb.currentLocation.lat, amb.currentLocation.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = { ambulance: amb, distance: dist };
    }
  });

  return nearest;
};

// Find the most suitable hospital
const findBestHospital = async (lat, lng, category, priority) => {
  console.log(`🏥 Finding hospital for: lat=${lat}, lng=${lng}, category=${category}, priority=${priority}`);
  
  const hospitals = await Hospital.find();
  console.log(`📊 Found ${hospitals.length} hospitals in database`);

  if (hospitals.length === 0) {
    console.log('❌ No hospitals found in database');
    return null;
  }

  // Map general emergency categories to hospital specialties
  const categoryMapping = {
    accident: 'trauma',
    fire: 'burns',
    general: 'general',
    injury: 'trauma',
    cardiac: 'cardiology',
    emergency: 'emergency'
  };

  const mappedCategory = categoryMapping[category.toLowerCase()] || category.toLowerCase();
  console.log(`🔄 Mapped category '${category}' to '${mappedCategory}'`);

  let bestHospital = null;
  let bestScore = -Infinity;

  for (const hospital of hospitals) {
    // Check if hospital has location data
    if (!hospital.location || typeof hospital.location.lat !== 'number' || typeof hospital.location.lng !== 'number') {
      console.log(`⚠️ Hospital ${hospital.name} has invalid location data`);
      continue;
    }

    const distance = calculateDistance(lat, lng, hospital.location.lat, hospital.location.lng);
    let score = 100 - (hospital.load || 0) - distance; // Base score

    // Check specialties
    const hospitalSpecialties = hospital.specialties || [];
    
    if (hospitalSpecialties.includes(mappedCategory)) {
      score += 20;
      console.log(`✅ Hospital ${hospital.name} has specialty '${mappedCategory}' (+20 points)`);
    }

    if (priority === 'HIGH' && hospitalSpecialties.includes('trauma')) {
      score += 15;
      console.log(`🚨 Hospital ${hospital.name} has trauma specialty for HIGH priority (+15 points)`);
    }

    console.log(`🏥 Hospital: ${hospital.name}, Distance: ${distance.toFixed(2)}km, Score: ${score.toFixed(2)}`);

    if (score > bestScore) {
      bestScore = score;
      bestHospital = { hospital, distance };
    }
  }

  if (bestHospital) {
    console.log(`🎯 Best hospital selected: ${bestHospital.hospital.name} (Score: ${bestScore.toFixed(2)})`);
  } else {
    console.log('❌ No suitable hospital found');
  }

  return bestHospital;
};

// Helper function to find ambulance by ID (supports both ObjectId and ambulance_id)
const findAmbulanceById = async (ambulanceId) => {
  let ambulance = await Ambulance.findById(ambulanceId);
  if (!ambulance) {
    ambulance = await Ambulance.findOne({ ambulance_id: ambulanceId });
  }
  return ambulance;
};

// ✅ MANUAL DISPATCH - Main dispatch function for Emergency Manager
const dispatchAmbulance = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    console.log(`🚑 MANUAL DISPATCH for emergency: ${emergencyId}`);
    
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) return res.status(404).json({ error: 'Emergency not found' });
    if (emergency.status !== 'pending') return res.status(400).json({ error: 'Emergency already handled' });

    console.log(`📍 Emergency location: ${emergency.location.lat}, ${emergency.location.lng}`);
    console.log(`🏷️ Emergency category: ${emergency.category}, Priority: ${emergency.priority}`);

    // Find nearest available ambulance
    const nearestResult = await findNearestAmbulance(emergency.location);
    if (!nearestResult) {
      return res.status(404).json({ error: 'No available ambulances found' });
    }

    const { ambulance, distance } = nearestResult;
    
    // Find best hospital
    const hospitalData = await findBestHospital(
      emergency.location.lat, 
      emergency.location.lng, 
      emergency.category, 
      emergency.priority
    );
    
    if (!hospitalData) return res.status(404).json({ error: 'No suitable hospital found' });

    // Calculate ETA from ambulance to emergency location
    const etaInSeconds = await calculateETA(ambulance.currentLocation, emergency.location);
    const estimatedArrival = new Date(Date.now() + etaInSeconds * 1000);

    // ✅ Update emergency status
    emergency.status = 'dispatched';
    emergency.assignedAmbulance = ambulance._id;
    await emergency.save();

    // ✅ Update ambulance
    ambulance.status = 'dispatched';
    ambulance.currentEmergency = emergency._id;
    ambulance.destination = {
      type: 'emergency',
      location: emergency.location,
      hospitalId: hospitalData.hospital._id,
      hospitalLocation: hospitalData.hospital.location,
      eta: etaInSeconds,
      estimatedArrival
    };
    await ambulance.save();

    // Create comprehensive dispatch data for frontend
    const dispatchData = {
      emergencyId: emergency._id,
      ambulanceId: ambulance._id,
      ambulance_id: ambulance.ambulance_id,
      hospitalId: hospitalData.hospital._id,
      ambulanceLocation: ambulance.currentLocation,
      emergencyLocation: emergency.location,
      hospitalLocation: hospitalData.hospital.location,
      status: 'dispatched',
      dispatchTime: new Date(),
      estimatedArrival,
      emergency: {
        _id: emergency._id,
        category: emergency.category,
        priority: emergency.priority,
        patientName: emergency.patientName,
        contactNumber: emergency.contactNumber
      },
      destination: {
        hospitalId: hospitalData.hospital._id,
        hospitalName: hospitalData.hospital.name
      },
      driverName: ambulance.driverName
    };

    // ✅ Emit real-time updates to all connected clients
    const io = getSocketInstance();
    io.emit('ambulance-dispatched', dispatchData);
    io.emit('emergency-status-updated', {
      emergencyId: emergency._id,
      newStatus: 'dispatched',
      ambulanceId: ambulance._id
    });
    io.emit('ambulance-status-updated', {
      ambulanceId: ambulance._id,
      ambulance_id: ambulance.ambulance_id,
      newStatus: 'dispatched'
    });

    console.log(`🚑 Successfully dispatched ambulance ${ambulance.ambulance_id} to emergency ${emergency._id}`);

    // Send success response
    res.json({
      success: true,
      message: 'Ambulance dispatched successfully',
      dispatch: dispatchData,
      ambulance: {
        id: ambulance._id,
        ambulance_id: ambulance.ambulance_id,
        driverName: ambulance.driverName
      },
      hospital: {
        name: hospitalData.hospital.name,
        distance: hospitalData.distance.toFixed(2) + ' km'
      },
      estimatedArrival,
      distance: distance.toFixed(2) + ' km'
    });

  } catch (error) {
    console.error('❌ Manual dispatch error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Ambulance arrives at emergency location
const arriveAtEmergency = async (req, res) => {
  try {
    const { ambulanceId } = req.params;
    console.log(`🚑 Ambulance ${ambulanceId} arriving at emergency`);
    
    const ambulance = await findAmbulanceById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    if (ambulance.status !== 'dispatched') {
      return res.status(400).json({ error: `Invalid ambulance status: ${ambulance.status}. Expected: dispatched` });
    }

    if (!ambulance.destination || !ambulance.destination.location) {
      console.error(`❌ Ambulance ${ambulance.ambulance_id} has no valid destination`);
      return res.status(400).json({ error: 'Ambulance destination not set' });
    }

    // Update ambulance status and location
    ambulance.status = 'busy';
    ambulance.currentLocation = ambulance.destination.location;
    await ambulance.save();

    const io = getSocketInstance();
    io.emit('ambulance-status-updated', { 
      ambulanceId: ambulance._id,
      ambulance_id: ambulance.ambulance_id, 
      newStatus: 'busy' 
    });
    io.emit('ambulance-location-updated', { 
      ambulanceId: ambulance._id,
      ambulance_id: ambulance.ambulance_id, 
      location: ambulance.currentLocation 
    });

    console.log(`🚑 Ambulance ${ambulance.ambulance_id} arrived at emergency`);

    res.json({ 
      success: true, 
      message: 'Ambulance arrived at emergency location',
      ambulance: {
        id: ambulance._id,
        ambulance_id: ambulance.ambulance_id,
        status: ambulance.status
      }
    });
  } catch (error) {
    console.error('❌ arriveAtEmergency error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Begin transporting patient to hospital
const transportToHospital = async (req, res) => {
  try {
    const { ambulanceId } = req.params;
    
    const ambulance = await findAmbulanceById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    if (ambulance.status !== 'busy') {
      return res.status(400).json({ error: `Invalid ambulance status: ${ambulance.status}. Expected: busy` });
    }

    ambulance.status = 'transporting';
    await ambulance.save();

    const io = getSocketInstance();
    io.emit('ambulance-status-updated', { 
      ambulanceId: ambulance._id,
      ambulance_id: ambulance.ambulance_id, 
      newStatus: 'transporting' 
    });

    console.log(`🚑 Ambulance ${ambulance.ambulance_id} transporting patient to hospital`);

    res.json({ 
      success: true, 
      message: 'Transporting patient to hospital',
      ambulance: {
        id: ambulance._id,
        ambulance_id: ambulance.ambulance_id,
        status: ambulance.status
      }
    });
  } catch (error) {
    console.error('❌ transportToHospital error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Complete dispatch (arrived at hospital)
const completeDispatch = async (req, res) => {
  try {
    const { ambulanceId } = req.params;
    
    const ambulance = await findAmbulanceById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    if (ambulance.status !== 'transporting') {
      return res.status(400).json({ error: `Invalid ambulance status: ${ambulance.status}. Expected: transporting` });
    }

    // Update emergency status to resolved
    const emergency = await Emergency.findById(ambulance.currentEmergency);
    if (emergency) {
      emergency.status = 'resolved';
      await emergency.save();

      const io = getSocketInstance();
      io.emit('emergency-status-updated', {
        emergencyId: emergency._id,
        newStatus: 'resolved'
      });
    }

    // Update hospital load
    const hospital = await Hospital.findById(ambulance.destination?.hospitalId);
    if (hospital && hospital.load < 95) {
      hospital.load += 5;
      await hospital.save();
      
      const io = getSocketInstance();
      io.emit('hospitalUpdate', hospital);
    }

    // Reset ambulance status and location
    ambulance.status = 'available';
    ambulance.currentLocation = ambulance.destination.hospitalLocation;
    ambulance.currentEmergency = null;
    ambulance.destination = null;
    await ambulance.save();

    const io = getSocketInstance();
    io.emit('ambulance-status-updated', {
      ambulanceId: ambulance._id,
      ambulance_id: ambulance.ambulance_id,
      newStatus: 'available'
    });
    io.emit('ambulance-location-updated', {
      ambulanceId: ambulance._id,
      ambulance_id: ambulance.ambulance_id,
      location: ambulance.currentLocation
    });

    console.log(`✅ Mission completed! Ambulance ${ambulance.ambulance_id} is now available`);

    res.json({
      success: true,
      message: 'Mission completed successfully. Ambulance is now available.',
      ambulance: {
        id: ambulance._id,
        ambulance_id: ambulance.ambulance_id,
        status: ambulance.status,
        location: ambulance.currentLocation
      }
    });
  } catch (error) {
    console.error('❌ completeDispatch error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all active dispatches for Emergency Manager View
const getActiveDispatches = async (req, res) => {
  try {
    const ambulances = await Ambulance.find({ 
      status: { $in: ['dispatched', 'busy', 'transporting'] } 
    }).populate('currentEmergency');

    const result = await Promise.all(ambulances.map(async amb => {
      let estimatedArrival = null;

      const status = amb.status;
      const ambulanceLoc = amb.currentLocation;
      const emergencyLoc = amb.destination?.location;
      const hospitalLoc = amb.destination?.hospitalLocation;

      // Calculate real-time ETA based on current status
      if (status === 'dispatched') {
        if (ambulanceLoc && emergencyLoc) {
          const seconds = await calculateETA(ambulanceLoc, emergencyLoc);
          estimatedArrival = new Date(Date.now() + seconds * 1000);
        }
      } else if (status === 'busy' || status === 'transporting') {
        if (ambulanceLoc && hospitalLoc) {
          const seconds = await calculateETA(ambulanceLoc, hospitalLoc);
          estimatedArrival = new Date(Date.now() + seconds * 1000);
        }
      }

      return {
        ambulanceId: amb._id,
        ambulance_id: amb.ambulance_id,
        status: amb.status,
        currentLocation: amb.currentLocation,
        emergencyLocation: amb.destination?.location,
        hospitalLocation: amb.destination?.hospitalLocation,
        emergency: amb.currentEmergency,
        destination: amb.destination,
        driverName: amb.driverName,
        estimatedArrival: estimatedArrival || amb.destination?.estimatedArrival
      };
    }));

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    console.error('❌ getActiveDispatches error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get available ambulances for manual dispatch selection
const getAvailableAmbulances = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    const ambulances = await Ambulance.find({ status: 'available' });
    
    if (!lat || !lng) {
      return res.json({
        success: true,
        data: ambulances.map(amb => ({
          _id: amb._id,
          ambulance_id: amb.ambulance_id,
          driverName: amb.driverName,
          currentLocation: amb.currentLocation,
          status: amb.status
        }))
      });
    }

    // Calculate distances and sort by nearest
    const ambulancesWithDistance = ambulances.map(amb => {
      const distance = calculateDistance(
        parseFloat(lat), 
        parseFloat(lng), 
        amb.currentLocation.lat, 
        amb.currentLocation.lng
      );
      
      return {
        _id: amb._id,
        ambulance_id: amb.ambulance_id,
        driverName: amb.driverName,
        currentLocation: amb.currentLocation,
        status: amb.status,
        distance: distance.toFixed(2),
        estimatedArrival: null // Will be calculated when dispatched
      };
    }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    res.json({
      success: true,
      data: ambulancesWithDistance,
      count: ambulancesWithDistance.length
    });
  } catch (error) {
    console.error('❌ getAvailableAmbulances error:', error);
    res.status(500).json({ error: error.message });
  }
};



module.exports = {
  dispatchAmbulance,        // ✅ Main manual dispatch function
  arriveAtEmergency,
  transportToHospital,
  completeDispatch,
  getActiveDispatches,      // ✅ For Emergency Manager dashboard
  getAvailableAmbulances,   // ✅ New: Get available ambulances for selection
 
 
};