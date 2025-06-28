import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "../../components/ui/VoiceRecorder"; // animated component

const ReportEmergency = () => {
  const [location, setLocation] = useState({ lat: "", lng: "" });
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLocation({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
          }),
        () => alert("⚠️ Location access denied.")
      );
    } else {
      alert("❌ Geolocation not supported.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!audioBlob || !location.lat || !location.lng) {
      alert("⚠️ Please record voice and set location.");
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
        setResult(data);
        alert(`✅ Emergency reported.\nRisk: ${data.risk_level}\nScore: ${data.risk_score}`);
        navigate("/");
      } else {
        alert("❌ " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to report emergency.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        🆘 Report Emergency via Voice
      </h1>

      {/* 🌐 Location */}
      <button
        type="button"
        onClick={handleLocationClick}
        className="text-blue-600 dark:text-blue-400 underline text-sm hover:text-blue-800 dark:hover:text-blue-300 mb-4"
      >
        📍 Use My Current Location
      </button>

      {/* 🗺️ Location fields */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
          type="number"
          placeholder="Latitude"
          value={location.lat}
          onChange={(e) => setLocation({ ...location, lat: e.target.value })}
          required
          className="p-2 border rounded dark:bg-gray-800 dark:text-white"
        />
        <input
          type="number"
          placeholder="Longitude"
          value={location.lng}
          onChange={(e) => setLocation({ ...location, lng: e.target.value })}
          required
          className="p-2 border rounded dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* 🎙️ Voice Recorder */}
      <VoiceRecorder onRecordingComplete={(blob) => setAudioBlob(blob)} />

      {/* 🚨 Submit */}
      <form onSubmit={handleSubmit} className="mt-6">
        <button
          type="submit"
          disabled={loading || !audioBlob}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg shadow disabled:opacity-50"
        >
          {loading ? "Submitting..." : "🚨 Submit Emergency"}
        </button>
      </form>

      {/* ✅ Result */}
      {result && (
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold mb-1 text-gray-700 dark:text-gray-200">✅ AI Result:</h3>
          <p>🩸 Risk Level: <strong>{result.risk_level}</strong></p>
          <p>📊 Risk Score: <strong>{result.risk_score}</strong></p>
          <p>📁 Type: <strong>{result.emergency_type}</strong></p>
        </div>
      )}
    </div>
  );
};

export default ReportEmergency;
