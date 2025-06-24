const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const getAvailableAmbulances = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/ambulance`);
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error('🚑 Error fetching ambulances:', error);
    return [];
  }
};
