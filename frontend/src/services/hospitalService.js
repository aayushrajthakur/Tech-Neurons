// hospitalService.js - placeholder

import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const fetchHospitals = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/hospitals`);
    return response.data;
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    return [];
  }
};
