// Emergency routes
const express = require("express");
const router = express.Router();
const {
  createEmergency,
  getAllEmergencies,
  handleEmergency,
  updateEmergencyStatus,
  deleteAllEmergencies
} = require("../controllers/emergencyController");

router.post("/", createEmergency);
router.get("/", getAllEmergencies);
router.post("/dispatch", handleEmergency); // POST /api/emergency
router.patch("/:id/status", updateEmergencyStatus);
router.delete("/deleteAll", deleteAllEmergencies);
module.exports = router;
