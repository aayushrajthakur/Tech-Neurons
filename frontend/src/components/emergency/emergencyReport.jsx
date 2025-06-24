import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ReportEmergency = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    contactNumber: "",
    category: "",
    priority: "MEDIUM",
    description: "",
    lat: "",
    lng: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          alert("⚠️ Location access denied or unavailable.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      alert("❌ Geolocation is not supported by this browser.");
    }
  };

const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const emergencyData = {
      ...formData,
      location: {
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
      },
    };

    try {
      const res = await fetch("http://localhost:5000/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emergencyData),
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Emergency reported successfully!");
        setFormData({
          patientName: "",
          contactNumber: "",
          category: "",
          priority: "MEDIUM",
          description: "",
          lat: "",
          lng: "",
        });
        navigate("/");

      } else {
        alert("❌ Failed to report emergency: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ An error occurred while reporting emergency.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">🚨 Report Emergency</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="patientName"
          value={formData.patientName}
          onChange={handleChange}
          placeholder="Patient Name"
          required
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          placeholder="Contact Number"
          required
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Emergency Category (e.g. Accident, Cardiac Arrest)"
          required
          className="w-full p-2 border rounded"
        />

        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="HIGH">🔴 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="LOW">🟢 Low</option>
        </select>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description (optional)"
          rows={3}
          className="w-full p-2 border rounded"
        />

        {/* 📍 Use My Location Button */}
        <button
          type="button"
          onClick={handleLocationClick}
          className="text-blue-600 underline text-sm hover:text-blue-800"
        >
          📍 Use My Current Location
        </button>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            name="lat"
            value={formData.lat}
            onChange={handleChange}
            placeholder="Latitude"
            required
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="lng"
            value={formData.lng}
            onChange={handleChange}
            placeholder="Longitude"
            required
            className="p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "🚨 Report Emergency"}
        </button>
      </form>
    </div>
  );
};

export default ReportEmergency;
