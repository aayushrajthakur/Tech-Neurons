// Loader.jsx - placeholder
// src/components/ui/Loader.jsx
import React from "react";
import ambulanceGif from "../assets/ambulance-loader.gif";

const Loader = ({ message = "Loading ERS-2 data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <img
        src={ambulanceGif}
        alt="Loading..."
        className="w-32 h-32 mb-4 animate-bounce"
      />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export default Loader;
