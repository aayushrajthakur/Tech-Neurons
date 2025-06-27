import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Phone, User, MapPin, AlertTriangle, Truck, Clock, CheckCircle, XCircle } from "lucide-react";
import apiService from "../../services/apiService";
import clsx from "clsx";

// Standardized status constants
const EMERGENCY_STATUSES = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  EN_ROUTE: 'en-route',
  ARRIVED: 'arrived',
  BUSY: 'busy',
  TRANSPORTING: 'transporting',
  RESOLVED: 'resolved'
};

// Priority-based color coding
const priorityColors = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

// Normalize emergency data structure
const normalizeEmergencyData = (emergency) => ({
  id: emergency._id || emergency.id || emergency.emergencyId,
  category: emergency.category,
  priority: emergency.priority,
  status: emergency.status,
  patientName: emergency.patientName,
  contactNumber: emergency.contactNumber,
  location: {
    lat: emergency.location?.lat || emergency.location?.latitude,
    lng: emergency.location?.lng || emergency.location?.longitude,
    address: emergency.location?.address
  },
  description: emergency.description,
  createdAt: emergency.createdAt || emergency.timestamp
});

const EmergencyCard = ({
  emergency,
  onDispatchSuccess,
  onUpdate,
  onDispatchEmergency,
  onMarkArrived,
  onMarkTransporting,
  onCompleteEmergency
}) => {

  const [isDispatching, setIsDispatching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Normalize the emergency data
  const normalizedEmergency = normalizeEmergencyData(emergency);

  const {
    id,
    category,
    priority,
    status,
    contactNumber,
    patientName,
    location,
    description,
    createdAt
  } = normalizedEmergency;

  // Enhanced status configuration
  const statusConfig = {
    [EMERGENCY_STATUSES.PENDING]: {
      color: "bg-red-100 border-red-500",
      textColor: "text-red-800",
      animate: "animate-pulse",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      label: "PENDING"
    },
    [EMERGENCY_STATUSES.DISPATCHED]: {
      color: "bg-blue-100 border-blue-500",
      textColor: "text-blue-800",
      animate: "",
      icon: Truck,
      iconColor: "text-blue-600",
      label: "DISPATCHED"
    },
    [EMERGENCY_STATUSES.EN_ROUTE]: {
      color: "bg-orange-100 border-orange-500",
      textColor: "text-orange-800",
      animate: "",
      icon: Truck,
      iconColor: "text-orange-600",
      label: "EN ROUTE"
    },
    [EMERGENCY_STATUSES.ARRIVED]: {
      color: "bg-purple-100 border-purple-500",
      textColor: "text-purple-800",
      animate: "",
      icon: CheckCircle,
      iconColor: "text-purple-600",
      label: "ARRIVED"
    },
    [EMERGENCY_STATUSES.BUSY]: {
      color: "bg-indigo-100 border-indigo-500",
      textColor: "text-indigo-800",
      animate: "",
      icon: Clock,
      iconColor: "text-indigo-600",
      label: "BUSY"
    },
    [EMERGENCY_STATUSES.TRANSPORTING]: {
      color: "bg-yellow-100 border-yellow-500",
      textColor: "text-yellow-800",
      animate: "",
      icon: Truck,
      iconColor: "text-yellow-600",
      label: "TRANSPORTING"
    },
    [EMERGENCY_STATUSES.RESOLVED]: {
      color: "bg-green-100 border-green-500",
      textColor: "text-green-800",
      animate: "",
      icon: CheckCircle,
      iconColor: "text-green-600",
      label: "COMPLETED"
    }
  };

  const currentStatusConfig = statusConfig[status] || statusConfig[EMERGENCY_STATUSES.PENDING];

  const handleDispatch = async () => {
    if (!id) {
      setError("Invalid emergency ID");
      return;
    }

    setIsDispatching(true);
    setError("");
    setSuccess("");

    try {
      console.log(`🚑 Dispatching ambulance for emergency: ${id}`);

      const response = await apiService.dispatchEmergency(id);

      console.log("📨 Dispatch response:", response);

      if (response && response.success) {
        setSuccess("Ambulance dispatched successfully!");

        // Trigger success callback with updated data
        if (onDispatchSuccess) {
          onDispatchSuccess({
            ...response,
            emergencyId: id,
            updatedEmergency: {
              ...normalizedEmergency,
              status: EMERGENCY_STATUSES.DISPATCHED
            }
          });
        }

        // Trigger general update callback
        if (onUpdate) {
          onUpdate({
            ...normalizedEmergency,
            status: EMERGENCY_STATUSES.DISPATCHED
          });
        }

        // Clear success message after delay
        setTimeout(() => {
          setSuccess("");
          setIsDispatching(false);
        }, 2000);

      } else {
        const errorMessage = response?.message || response?.error || "Failed to dispatch ambulance";
        setError(errorMessage);
        console.error("❌ Dispatch failed:", errorMessage);
        setIsDispatching(false);
      }
    } catch (error) {
      console.error("❌ Dispatch error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Network error occurred";
      setError(errorMessage);
      setIsDispatching(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const canDispatch = status === EMERGENCY_STATUSES.PENDING;
  const isInProgress = [
    EMERGENCY_STATUSES.DISPATCHED,
    EMERGENCY_STATUSES.EN_ROUTE,
    EMERGENCY_STATUSES.ARRIVED,
    EMERGENCY_STATUSES.BUSY,
    EMERGENCY_STATUSES.TRANSPORTING
  ].includes(status);
  const isCompleted = status === EMERGENCY_STATUSES.RESOLVED;

  const formatTime = (timeString) => {
    if (!timeString) return null;
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  const StatusIcon = currentStatusConfig.icon;

  return (
    <Card
      className={clsx(
        "mb-4 border-l-4 rounded-lg shadow-sm transition-all duration-500 ease-in-out hover:shadow-md",
        currentStatusConfig.color,
        currentStatusConfig.animate
      )}
    >
      <div className="p-4 relative">
        {/* Clear messages button */}
        {(error || success) && (
          <button
            onClick={clearMessages}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
          >
            <XCircle size={16} />
          </button>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <StatusIcon className={currentStatusConfig.iconColor} size={20} />
              <h2 className="text-lg font-semibold text-gray-800">
                🚨 {category || 'Emergency'}
              </h2>
              {priority && (
                <span className={clsx(
                  "text-xs px-3 py-1 rounded-full font-medium",
                  priorityColors[priority] || "bg-gray-100 text-gray-700"
                )}>
                  {priority} Priority
                </span>
              )}
              <span className={clsx(
                "text-xs px-2 py-1 rounded font-medium ml-auto",
                currentStatusConfig.textColor,
                currentStatusConfig.color
              )}>
                {currentStatusConfig.label}
              </span>
            </div>

            <CardContent className="space-y-3 mt-2 p-0">
              {/* Emergency ID */}
              <div className="text-xs text-gray-500">
                ID: {id?.slice(-8) || 'N/A'}
              </div>

              {/* Patient Info */}
              {patientName && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-gray-600" />
                  <span className="font-medium">Patient:</span>
                  <span>{patientName}</span>
                </div>
              )}

              {/* Contact */}
              {contactNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-gray-600" />
                  <span className="font-medium">Contact:</span>
                  <span>{contactNumber}</span>
                </div>
              )}

              {/* Location */}
              {location && (location.lat || location.address) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-gray-600" />
                  <span className="font-medium">Location:</span>
                  <span className="text-xs">
                    {location.address ||
                      (location.lat && location.lng ?
                        `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` :
                        'Location data unavailable')}
                  </span>
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="text-sm">
                  <span className="font-medium">Description:</span>
                  <span className="ml-2 text-gray-700">{description}</span>
                </div>
              )}

              {/* Timestamp */}
              {createdAt && formatTime(createdAt) && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={16} />
                  <span>Reported: {formatTime(createdAt)}</span>
                </div>
              )}
            </CardContent>
          </div>

          {/* Action Section */}
          {/* Action Section */}
          <div className="ml-4 flex flex-col gap-2">
            {/* Manual Controls */}
            {canDispatch && onDispatchEmergency && (
              <button
                onClick={() => onDispatchEmergency(id)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow min-w-[180px]"
              >
                🚨 Dispatch Ambulance
              </button>
            )}

            {status === 'dispatched' && onMarkArrived && (
              <button
                onClick={() => onMarkArrived(id)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 shadow min-w-[180px]"
              >
                ✅ Mark Arrived at Emergency
              </button>
            )}

            {status === 'arrived_at_emergency' && onMarkTransporting && (
              <button
                onClick={() => onMarkTransporting(id)}
                className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 shadow min-w-[180px]"
              >
                🚑 Start Transporting
              </button>
            )}

            {status === 'transporting' && onCompleteEmergency && (
              <button
                onClick={() => onCompleteEmergency(id)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow min-w-[180px]"
              >
                🏥 Mark as Completed
              </button>
            )}
          </div>


          {/* Status Indicators */}
          {isInProgress && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <Truck size={16} className="text-blue-600" />
              <span className="text-blue-700 font-medium">
                {status === EMERGENCY_STATUSES.DISPATCHED && "Ambulance Dispatched"}
                {status === EMERGENCY_STATUSES.EN_ROUTE && "En Route"}
                {status === EMERGENCY_STATUSES.ARRIVED && "Ambulance Arrived"}
                {status === EMERGENCY_STATUSES.BUSY && "Attending Patient"}
                {status === EMERGENCY_STATUSES.TRANSPORTING && "Transporting"}
              </span>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <CheckCircle size={16} />
              <span className="font-medium">Emergency Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 font-medium">Dispatch Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={clearMessages}
                className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-800 font-medium">Success!</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Message */}
      {isDispatching && !error && !success && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-blue-700">
              🚑 Finding nearest ambulance and dispatching...
            </p>
          </div>
        </div>
      )}
    
    </Card >
  );
};

export default EmergencyCard;