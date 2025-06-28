// routes/analyzeRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { analyzeAudioHandler } = require("../controllers/analyzeController");

const upload = multer({ dest: "uploads/" }); // use temp folder

router.post("/", upload.single("audio"), analyzeAudioHandler);

module.exports = router;
