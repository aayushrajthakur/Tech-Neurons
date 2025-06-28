import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder"; // ⬅ Import custom hook

const ReportEmergency = () => {
  const [location, setLocation] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const {
    recording,
    audioBlob,
    startRecording,
    stopRecording,
  } = useVoiceRecorder();

  const handleLocationClick = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        });
      },
      () => alert("⚠️ Location access denied.")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioBlob || !location.lat || !location.lng) {
      alert("⚠️ Please record audio and enter location.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("audio", new File([audioBlob], "recording.webm"));
    formData.append("lat", location.lat);
    formData.append("lng", location.lng);

    try {
      const res = await fetch("http://localhost:5001/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Emergency reported.\nRisk: ${data.risk_level}\nScore: ${data.risk_score}`);
        navigate("/");
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">🎙️ Report Emergency via Live Voice</h2>

      {/* 🎤 Record / Stop buttons */}
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={startRecording}
          disabled={recording}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          🎙️ Start Recording
        </button>
        <button
          type="button"
          onClick={stopRecording}
          disabled={!recording}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          ⏹️ Stop
        </button>
      </div>

      {/* 📍 Use Location */}
      <button
        type="button"
        onClick={handleLocationClick}
        className="text-blue-600 underline text-sm hover:text-blue-800"
      >
        📍 Use My Current Location
      </button>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
          disabled={loading || !audioBlob}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "🚨 Submit Voice Emergency"}
        </button>
      </form>
    </div>
  );
};

export default ReportEmergency;
