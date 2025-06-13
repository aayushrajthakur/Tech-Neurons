// Hospital routes
const express = require("express");
const router = express.Router();
const {
  createHospital,
  getAllHospitals
} = require("../controllers/hospitalController");


const Hospital = require("../models/Hospital");

// Bulk insert hospitals
router.post("/bulk", async (req, res) => {
  try {
    const hospitals = req.body;
    const inserted = await Hospital.insertMany(hospitals);
    res.status(200).json({ message: "Hospitals inserted", inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", createHospital);
router.get("/", getAllHospitals);

module.exports = router;
