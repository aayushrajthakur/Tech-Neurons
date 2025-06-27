import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  AlertTriangle,
  Hospital,
  Truck,
  CheckCircle,
  PlayCircle,
  User,
  Navigation,
  ArrowRight,
  XCircle,
  Phone
} from 'lucide-react';
import apiService from '../../services/apiService';
// Standardized status constants
const DISPATCH_STATUSES = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  EN_ROUTE: 'en-route',
  ARRIVED: 'arrived',
  BUSY: 'busy',
  TRANSPORTING: 'transporting',
  RESOLVED: 'resolved'
};

// Normalize dispatch data structure
const normalizeDispatchData = (dispatch) => {
  if (!dispatch) return null;
  
  const emergency = dispatch.emergency || {};
  const ambulance = dispatch.ambulance || {};
  const hospital = dispatch.hospital || {};
  
  return {
    id: dispatch._id || dispatch.id,
    emergencyId: dispatch.emergencyId || emergency._id || emergency.id,
    status: dispatch.status,
    dispatchTime: dispatch.dispatchTime || dispatch.createdAt,
    arrivalTime: dispatch.arrivalTime,
    completionTime: dispatch.completionTime,
    estimatedArrival: dispatch.estimatedArrival,
    emergency: {
      id: emergency._id || emergency.id,
      category: emergency.category,
      priority: emergency.priority,
      status: emergency.status,
      location: {
        lat: emergency.location?.lat || emergency.location?.latitude,
        lng: emergency.location?.lng || emergency.location?.longitude,
        address: emergency.location?.address
      },
      description: emergency.description,
      patientName: emergency.patientName,
      contactNumber: emergency.contactNumber
    },
    ambulance: {
      id: ambulance._id || ambulance.id,
      ambulanceId: ambulance.ambulance_id || ambulance.vehicleNumber || ambulance.id,
      driverName: ambulance.driverName,
      currentLocation: {
        lat: ambulance.currentLocation?.lat || ambulance.currentLocation?.latitude,
        lng: ambulance.currentLocation?.lng || ambulance.currentLocation?.longitude
      },
      status: ambulance.status
    },
    hospital: {
      id: hospital._id || hospital.id,
      name: hospital.name,
      location: hospital.location
    }
  };
};

const DispatchCard = ({ 
  dispatch, 
  onMarkArrived, 
  onMarkTransporting, 
  onCompleteEmergency, 
  onUpdateAmbulanceLocation,
  onUpdate 
}) => {
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Normalize the dispatch data
  const normalizedDispatch = normalizeDispatchData(dispatch);

  // Handle missing dispatch data
  if (!normalizedDispatch) {
    return (
      <div className="border rounded-lg p-4 mb-4 shadow-sm bg-gray-100 border-gray-300">
        <div className="flex items-center gap-2 text-gray-500">
          <AlertTriangle size={16} />
          <p>Invalid dispatch data</p>
        </div>
      </div>
    );
  }

  const {
    id: dispatchId,
    emergencyId,
    emergency,
    ambulance,
    hospital,
    status,
    dispatchTime,
    arrivalTime,
    completionTime,
    estimatedArrival
  } = normalizedDispatch;

  // Priority colors
  const priorityColors = {
    HIGH: 'text-red-600 bg-red-100',
    MEDIUM: 'text-yellow-600 bg-yellow-100',
    LOW: 'text-green-600 bg-green-100'
  };

  // Status colors and labels
  const statusConfig = {
    [DISPATCH_STATUSES.PENDING]: { 
      color: 'bg-red-100 border-red-300', 
      label: 'Pending',
      progress: 0,
      textColor: 'text-red-700'
    },
    [DISPATCH_STATUSES.DISPATCHED]: { 
      color: 'bg-blue-100 border-blue-300', 
      label: 'Dispatched',
      progress: 25,
      textColor: 'text-blue-700'
    },
    [DISPATCH_STATUSES.EN_ROUTE]: { 
      color: 'bg-orange-100 border-orange-300', 
      label: 'En Route',
      progress: 50,
      textColor: 'text-orange-700'
    },
    [DISPATCH_STATUSES.ARRIVED]: { 
      color: 'bg-purple-100 border-purple-300', 
      label: 'Arrived',
      progress: 75,
      textColor: 'text-purple-700'
    },
    [DISPATCH_STATUSES.BUSY]: { 
      color: 'bg-indigo-100 border-indigo-300', 
      label: 'Attending Patient',
      progress: 75,
      textColor: 'text-indigo-700'
    },
    [DISPATCH_STATUSES.TRANSPORTING]: { 
      color: 'bg-yellow-100 border-yellow-300', 
      label: 'Transporting',
      progress: 90,
      textColor: 'text-yellow-700'
    },
    [DISPATCH_STATUSES.RESOLVED]: {
      color: 'bg-green-100 border-green-300', 
      label: 'Completed',
      progress: 100,
      textColor: 'text-green-700'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig[DISPATCH_STATUSES.DISPATCHED];

  // Generic action handler with error handling
  const handleAction = async (actionName, actionFn, targetId) => {
    if (!actionFn || !targetId) {
      setError(`Invalid ${actionName} parameters`);
      return;
    }

    setActionLoading(prev => ({ ...prev, [actionName]: true }));
    setError("");
    setSuccess("");

    try {
      console.log(`🎯 ${actionName} for emergency:`, targetId);
      
      const result = await actionFn(targetId);
      
      console.log(`📨 ${actionName} response:`, result);

      if (result && result.success !== false) {
        setSuccess(`${actionName} completed successfully!`);
        
        // Trigger update callback
        if (onUpdate) {
          onUpdate(result.data || result);
        }

        // Clear success message after delay
        setTimeout(() => setSuccess(""), 3000);
        
      } else {
        const errorMessage = result?.message || result?.error || `${actionName} failed`;
        setError(errorMessage);
        console.error(`❌ ${actionName} failed:`, errorMessage);
      }
    } catch (error) {
      console.error(`❌ ${actionName} error:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || `${actionName} network error`;
      setError(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionName]: false }));
    }
  };

  const handleMarkArrived = () => handleAction('Mark Arrived', onMarkArrived, emergencyId);
  
  const handleComplete = () => handleAction('Complete Emergency', onCompleteEmergency, emergencyId);
const handleMarkTransporting = async () => {
  try {
    const res = await apiService.markTransporting(dispatch.emergencyId);
    if (res.success) {
      console.log("✅ Marked as transporting");
      // Optionally call a refresh or update state
    }
  } catch (error) {
    console.error("❌ Failed to mark as transporting:", error);
  }
};

  const handleLocationUpdate = async () => {
    if (!onUpdateAmbulanceLocation || !ambulance || isUpdatingLocation) return;

    const baseLat = ambulance.currentLocation?.lat;
    const baseLng = ambulance.currentLocation?.lng;

    if (baseLat == null || baseLng == null) {
      setError('Ambulance location data is missing');
      return;
    }

    setIsUpdatingLocation(true);
    setError("");

    try {
      // Simulate realistic location movement
      const newLocation = {
        lat: baseLat + (Math.random() - 0.5) * 0.001, // Smaller movement for realism
        lng: baseLng + (Math.random() - 0.5) * 0.001
      };

      console.log("📍 Updating ambulance location:", newLocation);

      const ambulanceId = ambulance.id || ambulance.ambulanceId;
      const result = await onUpdateAmbulanceLocation(ambulanceId, newLocation);

      if (result && result.success !== false) {
        setSuccess("Location updated successfully!");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(result?.message || "Failed to update location");
      }
    } catch (error) {
      console.error('❌ Location update error:', error);
      setError(error?.message || "Location update failed");
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Utility functions
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid time';
    }
  };

  const getTimeElapsed = (startTime) => {
    if (!startTime) return 'N/A';
    
    try {
      const now = new Date();
      const start = new Date(startTime);
      const diffMinutes = Math.floor((now - start) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m ago`;
    } catch {
      return 'N/A';
    }
  };

  const getEmergencyId = () => {
    return emergencyId?.slice(-6) || dispatchId?.slice(-6) || 'N/A';
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 shadow-sm transition-all duration-200 hover:shadow-md ${currentStatus.color} relative`}>
      {/* Clear messages button */}
      {(error || success) && (
        <button
          onClick={clearMessages}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
        >
          <XCircle size={16} />
        </button>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">
            Emergency #{getEmergencyId()}
          </h3>
          {emergency.priority && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[emergency.priority] || 'text-gray-600 bg-gray-100'}`}>
              {emergency.priority.toLowerCase()} priority
            </span>
          )}
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium px-2 py-1 rounded ${currentStatus.textColor} ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {getTimeElapsed(dispatchTime)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${currentStatus.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Dispatched</span>
          <span>En Route</span>
          <span>Arrived</span>
          <span>Completed</span>
        </div>
      </div>

      {/* Message Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md">
          <p className="text-green-700 text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            {success}
          </p>
        </div>
      )}

      {/* Emergency Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          {/* Patient Info */}
          {emergency.patientName && (
            <p className="text-sm text-gray-700 flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">Patient:</span> 
              <span>{emergency.patientName}</span>
            </p>
          )}

          {emergency.contactNumber && (
            <p className="text-sm text-gray-700 flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              <span className="font-medium">Contact:</span> 
              <span>{emergency.contactNumber}</span>
            </p>
          )}

          {emergency.category && (
            <p className="text-sm text-gray-700 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Category:</span> 
              <span className="capitalize">{emergency.category}</span>
            </p>
          )}
          
          {emergency.location && (emergency.location.lat || emergency.location.address) && (
            <p className="text-sm text-gray-700 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Location:</span>
              <span className="text-xs">
                {emergency.location.address || 
                 (emergency.location.lat && emergency.location.lng ? 
                  `${emergency.location.lat.toFixed(4)}, ${emergency.location.lng.toFixed(4)}` : 
                  'Location unavailable')}
              </span>
            </p>
          )}

          {emergency.description && (
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Description:</span> 
              <span className="ml-1">{emergency.description}</span>
            </p>
          )}

          {estimatedArrival && (
            <p className="text-sm text-gray-700 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">ETA:</span>
              <span>{formatTime(estimatedArrival)}</span>
            </p>
          )}
        </div>

        <div>
          {/* Ambulance Info */}
          {ambulance && ambulance.ambulanceId && (
            <div className="mb-3">
              <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4" />
                <span className="font-medium">Ambulance:</span>
                <span>#{ambulance.ambulanceId}</span>
              </p>
              {ambulance.driverName && (
                <p className="text-sm text-gray-600 ml-6">
                  Driver: {ambulance.driverName}
                </p>
              )}
              {ambulance.currentLocation && (ambulance.currentLocation.lat || ambulance.currentLocation.lng) && (
                <p className="text-sm text-gray-600 ml-6">
                  Location: {ambulance.currentLocation.lat?.toFixed(4)}, {ambulance.currentLocation.lng?.toFixed(4)}
                </p>
              )}
              {ambulance.status && (
                <p className="text-sm text-gray-600 ml-6">
                  Status: <span className="capitalize">{ambulance.status}</span>
                </p>
              )}
            </div>
          )}

          {/* Hospital Info */}
          {hospital && hospital.name && (
            <div className="mb-3">
              <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                <Hospital className="w-4 h-4" />
                <span className="font-medium">Hospital:</span>
                <span>{hospital.name}</span>
              </p>
              {hospital.location && (
                <p className="text-sm text-gray-600 ml-6">
                  {hospital.location.address || 
                   (hospital.location.lat && hospital.location.lng ? 
                    `${hospital.location.lat.toFixed(4)}, ${hospital.location.lng.toFixed(4)}` : 
                    '')}
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-1">
            {dispatchTime && (
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Dispatched: {formatTime(dispatchTime)}
              </p>
            )}
            {arrivalTime && (
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Arrived: {formatTime(arrivalTime)}
              </p>
            )}
            {completionTime && (
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Completed: {formatTime(completionTime)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
        {/* Location Update Button */}
        {onUpdateAmbulanceLocation && ambulance && ambulance.currentLocation && (
          <button
            onClick={handleLocationUpdate}
            disabled={isUpdatingLocation}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Navigation className="w-4 h-4" />
            {isUpdatingLocation ? 'Updating...' : 'Update Location'}
          </button>
        )}

        {/* Status Action Buttons */}
        {status === DISPATCH_STATUSES.DISPATCHED && onMarkArrived && (
          <button
            onClick={handleMarkArrived}
            disabled={actionLoading['Mark Arrived']}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            {actionLoading['Mark Arrived'] ? 'Marking...' : 'Mark Arrived'}
          </button>
        )}

        {status === DISPATCH_STATUSES.EN_ROUTE && onMarkArrived && (
          <button
            onClick={handleMarkArrived}
            disabled={actionLoading['Mark Arrived']}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            {actionLoading['Mark Arrived'] ? 'Marking...' : 'Mark Arrived'}
          </button>
        )}

        {(status === DISPATCH_STATUSES.ARRIVED || status === DISPATCH_STATUSES.BUSY) && onMarkTransporting && (
          <button
            onClick={handleMarkTransporting}
            disabled={actionLoading['Start Transport']}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            {actionLoading['Start Transport'] ? 'Starting...' : 'Start Transport'}
          </button>
        )}

        {status === DISPATCH_STATUSES.TRANSPORTING && onCompleteEmergency && (
          <button
            onClick={handleComplete}
            disabled={actionLoading['Complete Emergency']}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            {actionLoading['Complete Emergency'] ? 'Completing...' : 'Complete Emergency'}
          </button>
        )}

        {/* View Details Button */}
        <button
          className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm ml-auto"
          onClick={() => console.log('View details for emergency:', emergencyId)}
        >
          <PlayCircle className="w-4 h-4" />
          View Details
        </button>
      </div>
    </div>
  );
};

export default DispatchCard;