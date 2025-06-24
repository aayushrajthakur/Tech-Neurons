//calculateETA.js file
require('dotenv').config();
const axios = require('axios');

const ORS_API_KEY = process.env.ORS_API_KEY;

const calculateETA = async (from, to) => {
  try {
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const features = response.data?.features;

    if (!features || features.length === 0) {
      console.error('❌ ORS returned no route. Full response:', JSON.stringify(response.data, null, 2));
      return null;
    }

    const duration = features[0].properties.summary.duration; // in seconds
    return duration;
  } catch (err) {
    console.error('❌ Failed to calculate ETA:', err.response?.data || err.message);
    return null;
  }
};

module.exports = { calculateETA };
