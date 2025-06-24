// src/pages/EmergencyManager.jsx
import React, { useEffect, useState } from "react";
import { getActiveDispatches } from "../../services/dispatchService";
import { getEmergencies } from "../../services/emergencyService";
import { socket } from "../../services/socket";
import EmergencyManagerView from "../../components/cards/EmergencyManagerView";

const EmergencyManager = () => {
  const [dispatches, setDispatches] = useState([]);
  const [pendingEmergencies, setPendingEmergencies] = useState([]);
  const [resolvedEmergencies, setResolvedEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🚑 Fetch active ambulance dispatches
  const fetchDispatches = async () => {
    try {
      const res = await getActiveDispatches();
      setDispatches(res.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching dispatches:", err.message);
      setError("Failed to fetch dispatches");
    }
  };

  // 🩺 Fetch pending and resolved emergencies together
  const fetchEmergencies = async () => {
    try {
      const res = await getEmergencies();
      const all = res.data;
      setPendingEmergencies(all.filter((e) => e.status === "pending"));
      setResolvedEmergencies(all.filter((e) => e.status === "resolved"));
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching emergencies:", err.message);
      setError("Failed to fetch emergencies");
    }
  };

  // Combined refresh function for manual refresh
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDispatches(), fetchEmergencies()]);
    } catch (err) {
      console.error("Error refreshing data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDispatches(), fetchEmergencies()]);
    } catch (err) {
      console.error("Error loading initial data:", err.message);
      setError("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Real-time updates
  useEffect(() => {
    loadInitialData();

    // Socket event handlers
    const handleAmbulanceStatusUpdate = () => {
      fetchDispatches();
    };

    const handleAmbulanceLocationUpdate = () => {
      fetchDispatches();
    };

    const handleEmergencyStatusUpdate = () => {
      fetchDispatches();
      fetchEmergencies();
    };

    // Register socket listeners
    socket.on("ambulance-status-updated", handleAmbulanceStatusUpdate);
    socket.on("ambulanceLocationUpdate", handleAmbulanceLocationUpdate);
    socket.on("emergency-status-updated", handleEmergencyStatusUpdate);

    // Additional socket events that might be useful
    socket.on("dispatch:new", fetchDispatches);
    socket.on("dispatch:updated", fetchDispatches);
    socket.on("emergency:new", fetchEmergencies);
    socket.on("emergency:updated", fetchEmergencies);
    socket.on("emergency:deleted", fetchEmergencies);

    // Cleanup function
    return () => {
      socket.off("ambulance-status-updated", handleAmbulanceStatusUpdate);
      socket.off("ambulanceLocationUpdate", handleAmbulanceLocationUpdate);
      socket.off("emergency-status-updated", handleEmergencyStatusUpdate);
      socket.off("dispatch:new", fetchDispatches);
      socket.off("dispatch:updated", fetchDispatches);
      socket.off("emergency:new", fetchEmergencies);
      socket.off("emergency:updated", fetchEmergencies);
      socket.off("emergency:deleted", fetchEmergencies);
    };
  }, []);

  // Show loading state
  if (loading && dispatches.length === 0 && pendingEmergencies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emergency data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && dispatches.length === 0 && pendingEmergencies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <EmergencyManagerView
      dispatches={dispatches}
      pendingEmergencies={pendingEmergencies}
      resolvedEmergencies={resolvedEmergencies}
      onRefreshData={handleRefreshData}
    />
  );
};

export default EmergencyManager;