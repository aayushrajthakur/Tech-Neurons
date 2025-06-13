// Emergency routes
const express = require("express");
const router = express.Router();
const {
  createEmergency,
  getAllEmergencies,
  handleEmergency,
  updateEmergencyStatus
} = require("../controllers/emergencyController");

router.post("/", createEmergency);
router.get("/", getAllEmergencies);
router.post("/", handleEmergency); // POST /api/emergency
router.patch("/:id/status", updateEmergencyStatus);
module.exports = router;
