import React from "react";
import { Truck, MapPin, User, Clock, Hospital } from "lucide-react";

const AmbulanceCard = ({ data }) => {
  const {
    ambulance_id,
    driverName,
    status,
    currentLocation,
    emergency,
    destination,
    estimatedArrival
  } = data;

  const statusColors = {
    dispatched: "bg-yellow-100 border-yellow-300",
    busy: "bg-orange-100 border-orange-300",
    transporting: "bg-blue-100 border-blue-300"
  };

  const badgeColor = statusColors[status] || "bg-gray-100 border-gray-300";

  return (
    <div
      className={`border p-4 rounded-md mb-4 shadow-sm ${badgeColor} transition`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="w-5 h-5 text-gray-600" />
          Ambulance #{ambulance_id}
        </h3>
        <span className="text-sm font-medium capitalize text-gray-700">
          Status: {status}
        </span>
      </div>

      <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
        <User className="w-4 h-4" /> Driver: <strong>{driverName}</strong>
      </p>

      {emergency && (
        <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4" /> Emergency:{" "}
          <span className="capitalize">{emergency.category}</span> (
          {emergency.priority})
        </p>
      )}

      {destination?.hospitalId && (
        <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
          <Hospital className="w-4 h-4" /> Destination:{" "}
          {destination.hospitalName || "Hospital"}
        </p>
      )}

      {estimatedArrival && (
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" /> ETA:{" "}
          {new Date(estimatedArrival).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default AmbulanceCard;
