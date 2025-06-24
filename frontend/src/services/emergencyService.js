// src/services/emergencyService.js
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const getEmergencies = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/emergency`);
    if (!response.ok) throw new Error('Failed to fetch emergencies');
    const result = await response.json();
    return result; // ✅ Return the full object (e.g., { success: true, data: [...] })
  } catch (err) {
    console.error('❌ getEmergencies error:', err);
   
  }
};
