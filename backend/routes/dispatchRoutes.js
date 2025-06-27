// routes/dispatch.js

const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');

// Main dispatch routes
router.post('/emergency/:emergencyId/dispatch', dispatchController.dispatchEmergency);
router.get('/active', dispatchController.getActiveDispatches);
router.get('/stats', dispatchController.getDispatchStats);
router.get('/emergency/:emergencyId', dispatchController.getEmergencyDetails);

// Ambulance tracking routes
router.put('/ambulance/:ambulanceId/location', dispatchController.updateAmbulanceLocation);
router.put('/emergency/:emergencyId/arrived', dispatchController.markArrivedAtEmergency);
router.put('/emergency/:emergencyId/transporting', dispatchController.markTransporting);
router.put('/emergency/:emergencyId/complete', dispatchController.completeEmergency);

module.exports = router;