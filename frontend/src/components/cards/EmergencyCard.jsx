import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Phone, User, MapPin, AlertTriangle, Truck, Clock, CheckCircle } from "lucide-react";
import { dispatchAmbulance } from "../../services/dispatchService";
import clsx from "clsx";

// Priority-based color coding
const priorityColors = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

const EmergencyCard = ({ emergency, onDispatchSuccess }) => {
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState("");

  const {
    _id,
    category,
    priority,
    status,
    contactNumber,
    patientName,
    location,
  } = emergency;

  const statusColor = {
    pending: "bg-red-100 border-red-500 animate-pulse",
    resolved: "bg-green-50 border-green-500",
    dispatched: "bg-yellow-100 border-yellow-400",
  };

  const handleDispatch = async () => {
    try {
      setIsDispatching(true);
      setDispatchError("");
      
      
      const response = await dispatchAmbulance(_id);
      
      if (response.success) {
        console.log(`🚑 Dispatching ambulance for emergency ${_id}`);
        console.log("✅ Dispatch successful:", response);
        
        // Call success callback to refresh data
        if (onDispatchSuccess) {
          onDispatchSuccess(response);
        }
        
        // Show success message briefly
        setTimeout(() => {
          setIsDispatching(false);
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Dispatch failed:", error);
      setDispatchError(error.message || "Failed to dispatch ambulance");
      setIsDispatching(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="text-red-600" size={20} />;
      case 'dispatched':
        return <Truck className="text-yellow-600" size={20} />;
      case 'resolved':
        return <CheckCircle className="text-green-600" size={20} />;
      default:
        return <AlertTriangle className="text-gray-600" size={20} />;
    }
  };

  const canDispatch = status === 'pending';

  return (
    <Card
      className={clsx(
        "mb-4 border-l-4 rounded-lg shadow-sm transition-all duration-500 ease-in-out",
        statusColor[status] || "bg-white border-gray-200"
      )}
    >
      <div className="p-4 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                🚨 {category}
              </h2>
              {priority === "HIGH" && (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                  HIGH Priority
                </span>
              )}
            </div>
            
            <CardContent className="space-y-2 mt-2 p-0">
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-gray-600" />
                <span className="font-medium">{patientName}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-gray-600" />
                <span>{contactNumber}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-gray-600" />
                <span>Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</span>
              </div>
              
              <div className="text-sm">
                <span className="font-medium">Status: </span>
                <span className={clsx(
                  "px-2 py-1 rounded text-xs font-medium",
                  {
                    "bg-red-100 text-red-800": status === 'pending',
                    "bg-yellow-100 text-yellow-800": status === 'dispatched',
                    "bg-green-100 text-green-800": status === 'resolved'
                  }
                )}>
                  {status.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </div>
          
          {/* Dispatch Button */}
          <div className="ml-4">
            {canDispatch && (
              <button
                onClick={handleDispatch}
                disabled={isDispatching}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                  {
                    "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg": !isDispatching,
                    "bg-gray-400 text-gray-200 cursor-not-allowed": isDispatching,
                  }
                )}
              >
                {isDispatching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Truck size={16} />
                    Dispatch Ambulance
                  </>
                )}
              </button>
            )}
            
            {status === 'dispatched' && (
              <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                <Clock size={16} />
                <span>Ambulance En Route</span>
              </div>
            )}
            
            {status === 'resolved' && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle size={16} />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Error Message */}
        {dispatchError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              ❌ {dispatchError}
            </p>
          </div>
        )}
        
        {/* Success Message */}
        {isDispatching && !dispatchError && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              🚑 Finding nearest ambulance and dispatching...
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EmergencyCard;