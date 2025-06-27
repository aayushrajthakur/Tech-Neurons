// services/apiService.js

const API_BASE = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  // Generic request handler
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // --- Dispatch API ---
  async dispatchEmergency(emergencyId) {
    return this.request(`/dispatch/emergency/${emergencyId}/dispatch`, { method: 'POST' });
  }

  async getActiveDispatches() {
    return this.request('/dispatch/active');
  }

  async getDispatchStats() {
    return this.request('/dispatch/stats');
  }

  // ✅ ADDED: Missing method for getting emergency details
  async getEmergencyDetails(emergencyId) {
    return this.request(`/dispatch/emergency/${emergencyId}`);
  }

  // ✅ FIXED: Use 'lat' and 'lng' to match controller expectations
  async updateAmbulanceLocation(ambulanceId, location) {
    return this.request(`/dispatch/ambulance/${ambulanceId}/location`, {
      method: 'PUT',
      body: JSON.stringify({
        lat: location.lat || location.latitude,
        lng: location.lng || location.longitude
      }),
    });
  }

  async markEmergencyArrived(emergencyId) {
  const res = await this.request(`/dispatch/emergency/${emergencyId}/arrived`, {
    method: 'PUT',
  });
  return {
    success: res.success,
    message: res.message,
    data: res.data || null, // ⬅️ dispatch object
  };
}
async markTransporting(emergencyId) {
  const res = await this.request(`/dispatch/emergency/${emergencyId}/transporting`, {
    method: 'PUT',
  });
  return {
    success: res.success,
    message: res.message,
    data: res.data || null,
  };
}

async completeEmergency(emergencyId) {
  const res = await this.request(`/dispatch/emergency/${emergencyId}/complete`, {
    method: 'PUT',
  });
  return {
    success: res.success,
    message: res.message,
    data: res.data || null,
  };
}

  // --- Emergency API ---
  async getEmergencies(status = null) {
    const endpoint = status ? `/emergency?status=${status}` : '/emergency';
    return this.request(endpoint);
  }

  async createEmergency(emergencyData) {
    return this.request('/emergency', {
      method: 'POST',
      body: JSON.stringify(emergencyData),
    });
  }

  async updateEmergency(emergencyId, updateData) {
    return this.request(`/emergency/${emergencyId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteEmergency(emergencyId) {
    return this.request(`/emergency/${emergencyId}`, {
      method: 'DELETE',
    });
  }

  // --- Ambulance API ---
  async getAmbulances(status = null) {
    const endpoint = status ? `/ambulances?status=${status}` : '/ambulances';
    return this.request(endpoint);
  }

  async getAmbulanceById(ambulanceId) {
    return this.request(`/ambulances/${ambulanceId}`);
  }

  async updateAmbulanceStatus(ambulanceId, status) {
    return this.request(`/ambulances/${ambulanceId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // --- Hospital API ---
  async getHospitals() {
    return this.request('/hospitals');
  }

  async getHospitalById(hospitalId) {
    return this.request(`/hospitals/${hospitalId}`);
  }

  async updateHospitalLoad(hospitalId, load) {
    return this.request(`/hospitals/${hospitalId}/load`, {
      method: 'PUT',
      body: JSON.stringify({ load }),
    });
  }

  // --- Dashboard ---
  async getDashboardSummary() {
    return this.request('/dashboard/summary');
  }

  // --- Simulation ---
  // ✅ FIXED: Use 'lat' and 'lng' consistently
  async simulateEmergency(emergencyType = 'medical', priority = 'medium') {
    const baseLatitude = 28.7041;
    const baseLongitude = 77.1025;

    const emergencyData = {
      patientName: `Test Patient ${Math.floor(Math.random() * 1000)}`,
      contactNumber: '+91-9999999999',
      category: emergencyType,
      priority: priority.toUpperCase(), // ✅ FIXED: Controller expects uppercase
      location: {
        lat: baseLatitude + (Math.random() - 0.5) * 0.1,    // ✅ FIXED: Use 'lat'
        lng: baseLongitude + (Math.random() - 0.5) * 0.1,   // ✅ FIXED: Use 'lng'
        address: `Test Emergency Location ${Math.floor(Math.random() * 1000)}`
      },
      description: `Simulated ${emergencyType} emergency with ${priority} priority`
    };

    return this.createEmergency(emergencyData);
  }

  // ✅ FIXED: Handle location property names correctly
  async simulateAmbulanceMovement(ambulanceId) {
    const ambulance = await this.getAmbulanceById(ambulanceId);
    if (ambulance.success && ambulance.ambulance?.currentLocation) {
      const currentLoc = ambulance.ambulance.currentLocation;
      
      // Handle both possible property names
      const lat = currentLoc.lat || currentLoc.latitude;
      const lng = currentLoc.lng || currentLoc.longitude;
      
      if (!lat || !lng) {
        throw new Error('Invalid location data for ambulance');
      }

      const newLocation = {
        lat: lat + (Math.random() - 0.5) * 0.01,    // ✅ FIXED: Use 'lat'
        lng: lng + (Math.random() - 0.5) * 0.01     // ✅ FIXED: Use 'lng'
      };

      return this.updateAmbulanceLocation(ambulanceId, newLocation);
    }

    throw new Error('Ambulance not found or no location data');
  }

  async createMultipleEmergencies(count = 5) {
    const emergencyTypes = ['medical', 'accident', 'fire', 'trauma'];
    const priorities = ['low', 'medium', 'high'];

    const promises = Array.from({ length: count }, () => {
      const randomType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
      const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
      return this.simulateEmergency(randomType, randomPriority);
    });

    return Promise.all(promises);
  }

  // --- WebSocket Support (optional) ---
  connectWebSocket(onMessage) {
    if (typeof WebSocket !== 'undefined') {
      const wsUrl = API_BASE.replace('http', 'ws').replace('/api', '/ws');
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return ws;
    }

    console.warn('WebSocket not supported in this environment');
    return null;
  }
}

// Singleton instance
const apiService = new ApiService();
export default apiService;
export { ApiService };