// controllers/analyzeController.js

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const analyzeAudioHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No audio file provided" });
  }

  try {
    const filePath = path.resolve(req.file.path);
    const audioStream = fs.createReadStream(filePath);

    const response = await axios.post("http://localhost:5001/analyze", audioStream, {
      headers: {
        "Content-Type": "audio/m4a", // or "multipart/form-data" if needed by ai-service
      },
      params: {
        location: req.body.location || "", // optional location metadata
      },
    });

    // Clean up temporary file
    fs.unlink(filePath, () => {});

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Analyze Error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to analyze audio. Ensure AI service is running.",
    });
  }
};

module.exports = {
  analyzeAudioHandler,
};
