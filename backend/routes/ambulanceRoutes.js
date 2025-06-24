// Ambulance routes
const express = require("express");
const router = express.Router();
const {
  createAmbulance,
  getAvailableAmbulances,
  updateLocation,
  updateStatus,
  getAmbulanceStatus,
  updateAmbulanceLocation
} = require("../controllers/ambulanceController");

router.post("/", createAmbulance);
router.get("/", getAvailableAmbulances);
router.put("/:id/location", updateLocation);
router.patch("/:id/status", updateStatus);
router.get("/status", getAmbulanceStatus);
router.patch("/update", updateAmbulanceLocation);

module.exports = router;
