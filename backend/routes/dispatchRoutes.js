const express = require('express');
const router = express.Router();
const {
  dispatchAmbulance,
  arriveAtEmergency,
  transportToHospital,
  completeDispatch,
  getActiveDispatches,
  resetSimulation
} = require('../controllers/dispatchController');

// 🚑 Dispatch ambulance to emergency
router.post('/dispatch/:emergencyId', dispatchAmbulance);

// 🚨 Ambulance arrives at emergency location
router.post('/arrive/:ambulanceId', arriveAtEmergency);

// 🏥 Begin transporting patient to hospital
router.post('/transport/:ambulanceId', transportToHospital);

// ✅ Complete dispatch (arrived at hospital)
router.post('/complete/:ambulanceId', completeDispatch);

// 📡 Get all active dispatches
router.get('/active', getActiveDispatches);

module.exports = router;
