// Dispatch routes
const express = require("express");
const router = express.Router();
const { dispatchAmbulance } = require("../controllers/dispatchController");

router.post("/:emergencyId", dispatchAmbulance);


module.exports = router;

