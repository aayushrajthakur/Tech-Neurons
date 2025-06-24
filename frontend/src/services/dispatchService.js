// dispatchService.js - placeholder
const API_BASE = "http://localhost:5000/api";

export const dispatchAmbulance = async (emergencyId) => {
  try {
    const response = await fetch(`${API_BASE}/dispatch/${emergencyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to dispatch ambulance");
    }
    
    return await response.json();
  } catch (error) {
    console.error("❌ Dispatch error:", error);
    throw error;
  }
};

export const getActiveDispatches = async () => {
  try {
    const response = await fetch(`${API_BASE}/dispatch/active`);
    if (!response.ok) throw new Error("Failed to fetch dispatches");
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching dispatches:", error);
    return [];
  }
};

