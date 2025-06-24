import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Clock, Info, MapPin, Phone, User } from "lucide-react";
import moment from "moment";

const statusColors = {
  dispatched: "bg-yellow-100 text-yellow-800",
  busy: "bg-orange-100 text-orange-800",
  transporting: "bg-blue-100 text-blue-800",
};

const DispatchCard = ({ dispatch }) => {
  const { ambulance_id, status, driverName, estimatedArrival, emergency, destination } = dispatch;
  const [expanded, setExpanded] = useState(false);
  const [etaCountdown, setEtaCountdown] = useState("");

  useEffect(() => {
    if (!estimatedArrival) return;

    const updateCountdown = () => {
      const now = moment();
      const arrival = moment(estimatedArrival);
      const duration = moment.duration(arrival.diff(now));
      if (duration.asSeconds() <= 0) {
        setEtaCountdown("Arrived");
      } else {
        setEtaCountdown(`${duration.minutes()}m ${duration.seconds()}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [estimatedArrival]);

  return (
    <div className="border rounded-lg p-4 mb-4 shadow-md bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-lg">
            🚑 Ambulance #{ambulance_id} - {driverName}
          </p>
          <p className="text-sm text-gray-600">
            Status:
            <span className={`ml-2 px-2 py-1 rounded ${statusColors[status]}`}>
              {status.toUpperCase()}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center text-gray-700">
            <Clock size={16} className="mr-1" />
            <span className="text-sm">ETA: {etaCountdown}</span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:underline flex items-center"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} className="mr-1" /> Hide
              </>
            ) : (
              <>
                <ChevronDown size={16} className="mr-1" /> Details
              </>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 text-sm text-gray-700 space-y-2">
          <div>
            <h4 className="font-semibold flex items-center mb-1">
              <Info size={14} className="mr-1" /> Emergency Details
            </h4>
            <p>
              <User size={14} className="inline mr-1" />
              {emergency?.patientName || "N/A"}
            </p>
            <p>
              <Phone size={14} className="inline mr-1" />
              {emergency?.contactNumber || "N/A"}
            </p>
            <p>
              <MapPin size={14} className="inline mr-1" />
              Lat: {dispatch.emergencyLocation?.lat.toFixed(4)}, Lng:{" "}
              {dispatch.emergencyLocation?.lng.toFixed(4)}
            </p>
            <p>
              Category: {emergency?.category} | Priority: {emergency?.priority}
            </p>
          </div>

          <div>
            <h4 className="font-semibold flex items-center mt-3 mb-1">
              <MapPin size={14} className="mr-1" /> Hospital Info
            </h4>
            <p>Name: {destination?.hospitalName || "N/A"}</p>
            <p>
              Location: Lat {dispatch.hospitalLocation?.lat.toFixed(4)}, Lng{" "}
              {dispatch.hospitalLocation?.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchCard;
