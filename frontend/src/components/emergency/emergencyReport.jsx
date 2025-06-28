import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ← Add this line

const ReportEmergency = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [location, setLocation] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate(); // ← Initialize navigation

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          });
        },
        (error) => {
          alert("⚠️ Location access denied or unavailable.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      alert("❌ Geolocation not supported by your browser.");
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!audioFile || !location.lat || !location.lng) {
      alert("⚠️ Please provide an audio file and location.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("lat", location.lat);
    formData.append("lng", location.lng);

    try {
      const res = await fetch("http://localhost:5001/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        alert(`✅ Emergency reported.\nRisk Level: ${data.risk_level}\nScore: ${data.risk_score}`);
        navigate("/"); // ← Redirect after success
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit emergency.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">🎙️ Report Emergency via Voice</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioChange}
          required
          className="w-full p-2 border rounded"
        />

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
            placeholder="Latitude"
            value={location.lat}
            onChange={(e) => setLocation((prev) => ({ ...prev, lat: e.target.value }))}
            required
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={location.lng}
            onChange={(e) => setLocation((prev) => ({ ...prev, lng: e.target.value }))}
            required
            className="p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "🚨 Submit Voice Emergency"}
        </button>
      </form>

      {result && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <h3 className="font-semibold">✅ Risk Analysis Result:</h3>
          <p>Risk Level: <strong>{result.risk_level}</strong></p>
          <p>Risk Score: <strong>{result.risk_score}</strong></p>
          <p>Emergency Type: <strong>{result.emergency_type}</strong></p>
        </div>
      )}
    </div>
  );
};

export default ReportEmergency;
