import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../components/map/MapView";
import EmergencyManager from "../components/emergency/EmergencyManager";
import { getDashboardSummary } from "../services/api";
import Loader from "../components/Loader";


const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error("Error loading dashboard summary", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <Loader message="🚑 Dispatching data from control room..." />;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-blue-600 mb-2">ERS-2 Admin Dashboard</h1>
       <p className="mb-6">This is the dashboard. Realtime data will appear here.</p>
      {/* 🚨 Report Emergency Button */}
      <div className="flex justify-end mb-4">
        <Link
          to="/report"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold shadow"
        >
          + Report Emergency
        </Link>
      </div>

      {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Hospitals */}
        <div className="bg-white shadow-md rounded-2xl p-4">
          <h2 className="text-lg font-semibold">Hospitals</h2>
          <p>Total: {summary.hospitals.totalHospitals}</p>
          <p>Average Load: {summary.hospitals.avgHospitalLoad}%</p>
        </div>

        {/* Ambulances */}
        <div className="bg-white shadow-md rounded-2xl p-4">
          <h2 className="text-lg font-semibold">Ambulances</h2>
          <p>Total: {summary.ambulances.totalAmbulances}</p>
          <p>Available: {summary.ambulances.availableAmbulances}</p>
          <p>Busy: {summary.ambulances.busyAmbulances}</p>
        </div>

        {/* Emergencies */}
        <div className="bg-white shadow-md rounded-2xl p-4">
          <h2 className="text-lg font-semibold">Emergencies</h2>
          <p>Total: {summary.emergencies.totalEmergencies}</p>
          <p>Pending: {summary.emergencies.pending}</p>
          <p>Dispatched: {summary.emergencies.dispatched}</p>
          <p>Resolved: {summary.emergencies.resolved}</p>
        </div>
      </div>
  

      <div className="mb-6">
        <EmergencyManager />
      </div>

      <div className="p-4 bg-white shadow-md rounded-2xl">
        <h1 className="text-xl font-semibold text-blue-600 mb-4">ERS-2 Live Ambulance Map</h1>
        <MapView />
      </div>
    </div>
  );
};

export default Dashboard;