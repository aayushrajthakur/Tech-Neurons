import React, { useEffect, useState } from 'react';
import { socket } from '../../services/socket';
import apiService from '../../services/apiService';
import EmergencyManagerView from '../cards/EmergencyManagerView';

const EmergencyManager = () => {
  const [dispatches, setDispatches] = useState([]);
  const [pendingEmergencies, setPendingEmergencies] = useState([]);
  const [resolvedEmergencies, setResolvedEmergencies] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDispatches = async () => {
    try {
      const data = await apiService.getActiveDispatches();
      if (data.success) {
        setDispatches(data.dispatches || []);
      }
    } catch (error) {
      console.error('Dispatch fetch error:', error);
      setError('Failed to fetch active dispatches');
    }
  };

  const fetchEmergencies = async () => {
  try {
    const data = await apiService.getEmergencies();
    console.log('📦 Raw Emergencies:', data);

    const normalize = (s) => (s || '').toLowerCase().trim();
    const activeStatuses = ['pending', 'dispatched', 'arrived_at_emergency', 'transporting','arrived_at_hospital' ];

    if (Array.isArray(data.data)) {
      data.data.forEach(e => console.log(`- ${e.status}`));

      const pending = data.data.filter(e => {
        const normalized = normalize(e.status);
        const isMatch = activeStatuses.includes(normalized);
        console.log(`🔍 Emergency ${e._id}: status="${e.status}" → normalized="${normalized}" → match=${isMatch}`);
        return isMatch;
      });

      const resolved = data.data.filter(e => normalize(e.status) === 'resolved');
      //console.log("resolved emergencies:",resolved);
      setPendingEmergencies(pending);
      setResolvedEmergencies(resolved);

      // console.log("🧪 Filtered Pending Emergencies:", pending);
      // console.log("✅ Filtered Resolved Emergencies:", resolved);
    } else {
      console.warn("⚠️ Unexpected emergency data format:", data);
      setPendingEmergencies([]);
      setResolvedEmergencies([]);
    }
  } catch (error) {
    console.error('Emergency fetch error:', error);
    setError('Failed to fetch emergencies');
  }
};

  
  const fetchStats = async () => {
    try {
      const data = await apiService.getDispatchStats();
      if (data.success) {
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
      setError('Failed to fetch statistics');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchDispatches(),
        fetchEmergencies(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching all data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Handle emergency dispatch
  const handleDispatchEmergency = async (emergencyId) => {
    try {
      setLoading(true);
      const result = await apiService.dispatchEmergency(emergencyId);
      if (result.success) {
        // Refresh data after successful dispatch
        await fetchAllData();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error || 'Dispatch failed' };
    } catch (error) {
      console.error('Dispatch emergency error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle emergency status updates
  const handleMarkArrived = async (emergencyId) => {
    try {
      const result = await apiService.markEmergencyArrived(emergencyId);
      if (result.success) {
        await fetchAllData();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error };
    } catch (error) {
      console.error('Mark arrived error:', error);
      return { success: false, message: error.message };
    }
  };

  const handleMarkTransporting = async (emergencyId) => {
    try {
      const result = await apiService.markTransporting(emergencyId);
      if (result.success) {
        await fetchAllData();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error };
    } catch (error) {
      console.error('Mark transporting error:', error);
      return { success: false, message: error.message };
    }
  };

  const handleCompleteEmergency = async (emergencyId) => {
    try {
      const result = await apiService.completeEmergency(emergencyId);
      if (result.success) {
        await fetchAllData();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error };
    } catch (error) {
      console.error('Complete emergency error:', error);
      return { success: false, message: error.message };
    }
  };

  // Handle ambulance location updates
  const handleUpdateAmbulanceLocation = async (ambulanceId, location) => {
    try {
      const result = await apiService.updateAmbulanceLocation(ambulanceId, location);
      if (result.success) {
        // Optionally refresh dispatches to show updated location
        await fetchDispatches();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error };
    } catch (error) {
      console.error('Update ambulance location error:', error);
      return { success: false, message: error.message };
    }
  };

  // Socket event handlers - moved here to avoid duplication
  const handleDispatchNew = (data) => {
    console.log('New dispatch:', data);
    setDispatches(prev => [data, ...prev]);
    fetchStats(); // Update stats
  };

  const handleDispatchUpdate = (data) => {
    console.log('Dispatch updated:', data);
    setDispatches(prev => prev.map(d => d._id === data._id ? data : d));
  };

  const handleNewEmergency = (emergency) => {
    console.log('New emergency:', emergency);
    if (emergency.status === 'pending') {
      setPendingEmergencies(prev => [emergency, ...prev]);
    }
  };

  const handleEmergencyUpdate = (updated) => {
    console.log('Emergency updated:', updated);
    if (updated.status === 'resolved') {
      setPendingEmergencies(prev => prev.filter(e => e._id !== updated._id));
      setResolvedEmergencies(prev => [updated, ...prev]);
    } else {
      setPendingEmergencies(prev => 
        prev.map(e => e._id === updated._id ? updated : e)
      );
    }
  };

  const handleEmergencyDeleted = (id) => {
    console.log('Emergency deleted:', id);
    setPendingEmergencies(prev => prev.filter(e => e._id !== id));
    setResolvedEmergencies(prev => prev.filter(e => e._id !== id));
  };

  const handleAmbulanceLocationUpdate = (data) => {
    console.log('Ambulance location updated:', data);
    setDispatches(prev => 
      prev.map(d => 
        d.ambulance && d.ambulance._id === data.ambulanceId 
          ? { ...d, ambulance: { ...d.ambulance, currentLocation: data.location } }
          : d
      )
    );
  };

  const handleAmbulanceArrivedEmergency = (data) => {
    console.log('Ambulance arrived at emergency:', data);
    fetchDispatches();
    fetchStats();
  };

  const handleAmbulanceTransporting = (data) => {
    console.log('Ambulance transporting:', data);
    fetchDispatches();
    fetchStats();
  };

  const handleEmergencyCompleted = (data) => {
    console.log('Emergency completed:', data);
    fetchAllData(); // Full refresh when emergency is completed
  };

  useEffect(() => {
    fetchAllData();

    // Socket listeners - only in parent component
    socket.on('dispatch:new', handleDispatchNew);
    socket.on('dispatch:updated', handleDispatchUpdate);
    socket.on('emergency:new', handleNewEmergency);
    socket.on('emergency:updated', handleEmergencyUpdate);
    socket.on('emergency:deleted', handleEmergencyDeleted);
    socket.on('ambulance:location-update', handleAmbulanceLocationUpdate);
    socket.on('ambulance:arrived-emergency', handleAmbulanceArrivedEmergency);
    socket.on('ambulance:transporting', handleAmbulanceTransporting);
    socket.on('emergency:completed', handleEmergencyCompleted);

    return () => {
      // Cleanup socket listeners
      socket.off('dispatch:new', handleDispatchNew);
      socket.off('dispatch:updated', handleDispatchUpdate);
      socket.off('emergency:new', handleNewEmergency);
      socket.off('emergency:updated', handleEmergencyUpdate);
      socket.off('emergency:deleted', handleEmergencyDeleted);
      socket.off('ambulance:location-update', handleAmbulanceLocationUpdate);
      socket.off('ambulance:arrived-emergency', handleAmbulanceArrivedEmergency);
      socket.off('ambulance:transporting', handleAmbulanceTransporting);
      socket.off('emergency:completed', handleEmergencyCompleted);
    };
  }, []);

  return (
    <EmergencyManagerView
      dispatches={dispatches}
      pendingEmergencies={pendingEmergencies}
      resolvedEmergencies={resolvedEmergencies}
      stats={stats}
      loading={loading}
      error={error}
      onRefreshData={fetchAllData}
      onDispatchEmergency={handleDispatchEmergency}
      onMarkArrived={handleMarkArrived}
      onMarkTransporting={handleMarkTransporting}
      onCompleteEmergency={handleCompleteEmergency}
      onUpdateAmbulanceLocation={handleUpdateAmbulanceLocation}
    />
  );
};

export default EmergencyManager;