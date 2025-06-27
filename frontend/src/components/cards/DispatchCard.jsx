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
  ArrowRight
} from 'lucide-react';

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

  // Handle missing dispatch data
  if (!dispatch) {
    return (
      <div className="border rounded-lg p-4 mb-4 shadow-sm bg-gray-100 border-gray-300">
        <p className="text-gray-500">Invalid dispatch data</p>
      </div>
    );
  }

  const {
    _id,
    emergency,
    ambulance,
    hospital,
    status,
    dispatchTime,
    arrivalTime,
    completionTime,
    estimatedArrival
  } = dispatch;

  // Get emergency details
  const emergencyData = emergency || {};
  const {
    category,
    priority,
    location,
    description
  } = emergencyData;

  // Priority colors
  const priorityColors = {
    high: 'text-red-600 bg-red-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100'
  };

  // Status colors and labels
  const statusConfig = {
    dispatched: { 
      color: 'bg-blue-100 border-blue-300', 
      label: 'Dispatched',
      progress: 25
    },
    'en-route': { 
      color: 'bg-orange-100 border-orange-300', 
      label: 'En Route',
      progress: 50
    },
    arrived: { 
      color: 'bg-purple-100 border-purple-300', 
      label: 'Arrived',
      progress: 75
    },
    transporting: { 
      color: 'bg-indigo-100 border-indigo-300', 
      label: 'Transporting',
      progress: 90
    },
    completed: { 
      color: 'bg-green-100 border-green-300', 
      label: 'Completed',
      progress: 100
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.dispatched;

  // Action handlers with loading states
  const handleMarkArrived = async () => {
    if (!onMarkArrived || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await onMarkArrived(_id);
      if (result && !result.success) {
        console.error('Failed to mark arrived:', result.message);
      }
    } catch (error) {
      console.error('Error marking arrived:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkTransporting = async () => {
    if (!onMarkTransporting || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await onMarkTransporting(_id);
      if (result && !result.success) {
        console.error('Failed to mark transporting:', result.message);
      }
    } catch (error) {
      console.error('Error marking transporting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!onCompleteEmergency || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await onCompleteEmergency(_id);
      if (result && !result.success) {
        console.error('Failed to complete emergency:', result.message);
      }
    } catch (error) {
      console.error('Error completing emergency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationUpdate = async () => {
    if (!onUpdateAmbulanceLocation || !ambulance || isUpdatingLocation) return;
    
    setIsUpdatingLocation(true);
    try {
      // Simulate GPS update with slight variation
      const newLocation = {
        latitude: (location?.latitude || 0) + (Math.random() - 0.5) * 0.01,
        longitude: (location?.longitude || 0) + (Math.random() - 0.5) * 0.01,
        timestamp: new Date().toISOString()
      };
      
      const result = await onUpdateAmbulanceLocation(ambulance._id || ambulance.ambulance_id, newLocation);
      if (result && !result.success) {
        console.error('Failed to update location:', result.message);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Utility functions
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeElapsed = (startTime) => {
    if (!startTime) return 'N/A';
    
    const now = new Date();
    const start = new Date(startTime);
    const diffMinutes = Math.floor((now - start) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m ago`;
    }
  };

  const getEmergencyId = () => {
    return _id?.slice(-6) || emergency?._id?.slice(-6) || 'N/A';
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 shadow-sm transition-all duration-200 hover:shadow-md ${currentStatus.color}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">
            Emergency #{getEmergencyId()}
          </h3>
          {priority && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority] || 'text-gray-600 bg-gray-100'}`}>
              {priority} priority
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-gray-700">
            {currentStatus.label}
          </span>
          <p className="text-xs text-gray-500">
            {getTimeElapsed(dispatchTime)}
          </p>
        </div>
      </div>

      {/* Emergency Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          {category && (
            <p className="text-sm text-gray-700 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Category:</span> 
              <span className="capitalize">{category}</span>
            </p>
          )}
          
          {location && (
            <p className="text-sm text-gray-700 flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4" />
              <span className="font-medium">Location:</span>
              <span className="text-xs">
                {location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`}
              </span>
            </p>
          )}

          {description && (
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Description:</span> {description}
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
          {ambulance && (
            <div className="mb-3">
              <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4" />
                <span className="font-medium">Ambulance:</span>
                <span>#{ambulance.ambulance_id || ambulance.vehicleNumber}</span>
              </p>
              {ambulance.driverName && (
                <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Driver:</span>
                  <span>{ambulance.driverName}</span>
                </p>
              )}
              {ambulance.currentLocation && (
                <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                  <Navigation className="w-4 h-4" />
                  <span className="font-medium">Current:</span>
                  <span className="text-xs">
                    {ambulance.currentLocation.latitude?.toFixed(4)}, {ambulance.currentLocation.longitude?.toFixed(4)}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Hospital Info */}
          {hospital && (
            <p className="text-sm text-gray-700 flex items-center gap-2 mb-2">
              <Hospital className="w-4 h-4" />
              <span className="font-medium">Hospital:</span>
              <span>{hospital.name}</span>
            </p>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            {dispatchTime && (
              <p>Dispatched: {formatTime(dispatchTime)}</p>
            )}
            {arrivalTime && (
              <p>Arrived: {formatTime(arrivalTime)}</p>
            )}
            {completionTime && (
              <p>Completed: {formatTime(completionTime)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap mb-3">
        {status === 'dispatched' && (
          <>
            <button
              onClick={handleMarkArrived}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-4 h-4" />
              {isLoading ? 'Processing...' : 'Mark Arrived'}
            </button>
            <button
              onClick={handleLocationUpdate}
              disabled={isUpdatingLocation}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition flex items-center gap-1 disabled:opacity-50"
            >
              <Navigation className="w-4 h-4" />
              {isUpdatingLocation ? 'Updating...' : 'Update Location'}
            </button>
          </>
        )}
        
        {status === 'arrived' && (
          <button
            onClick={handleMarkTransporting}
            disabled={isLoading}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition flex items-center gap-1 disabled:opacity-50"
          >
            <ArrowRight className="w-4 h-4" />
            {isLoading ? 'Processing...' : 'Start Transport'}
          </button>
        )}

        {status === 'transporting' && (
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {isLoading ? 'Processing...' : 'Complete'}
          </button>
        )}

        {status === 'completed' && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        )}
      </div>

      {/* Progress Indicator */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Dispatched</span>
          <span>Arrived</span>
          <span>Transport</span>
          <span>Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              status === 'completed' ? 'bg-green-500' :
              status === 'transporting' ? 'bg-indigo-500' :
              status === 'arrived' ? 'bg-purple-500' :
              status === 'dispatched' ? 'bg-blue-500' :
              'bg-gray-300'
            }`}
            style={{ width: `${currentStatus.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default DispatchCard;