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

const DISPATCH_STATUSES = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  EN_ROUTE: 'en-route',
  ARRIVED: 'arrived',
  ARRIVED_AT_EMERGENCY: 'arrived_at_emergency',
  ARRIVED_AT_HOSPITAL: 'arrived_at_hospital',
  BUSY: 'busy',
  TRANSPORTING: 'transporting',
  RESOLVED: 'resolved'
};

// Normalize dispatch data
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
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalizedDispatch = normalizeDispatchData(dispatch);
  if (!normalizedDispatch) return null;

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

  const normalizedStatus = (status || '').toLowerCase().trim();

  const priorityColors = {
    HIGH: 'text-red-600 bg-red-100',
    MEDIUM: 'text-yellow-600 bg-yellow-100',
    LOW: 'text-green-600 bg-green-100'
  };

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
    [DISPATCH_STATUSES.ARRIVED_AT_EMERGENCY]: {
      color: 'bg-purple-100 border-purple-300',
      label: 'At Emergency',
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
    [DISPATCH_STATUSES.ARRIVED_AT_HOSPITAL]: {
      color: 'bg-green-100 border-green-300',
      label: 'At Hospital',
      progress: 95,
      textColor: 'text-green-700'
    },
    [DISPATCH_STATUSES.RESOLVED]: {
      color: 'bg-green-100 border-green-300',
      label: 'Completed',
      progress: 100,
      textColor: 'text-green-700'
    }
  };

  const currentStatus = statusConfig[normalizedStatus] || statusConfig[DISPATCH_STATUSES.DISPATCHED];

  const handleAction = async (actionName, actionFn, targetId) => {
    if (!actionFn || !targetId) return setError(`Invalid ${actionName} parameters`);

    setActionLoading(prev => ({ ...prev, [actionName]: true }));
    setError('');
    setSuccess('');

    try {
      const result = await actionFn(targetId);
      if (result?.success !== false) {
        setSuccess(`${actionName} completed`);
        if (onUpdate) onUpdate(result.data || result);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result?.message || result?.error || `${actionName} failed`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || `${actionName} failed`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionName]: false }));
    }
  };

  const handleMarkArrived = () => handleAction('Mark Arrived', onMarkArrived, emergencyId);
  const handleComplete = () => handleAction('Complete Emergency', onCompleteEmergency, emergencyId);

  const handleMarkTransporting = async () => {
    try {
      const res = await apiService.markTransporting(dispatch.emergencyId);
      if (res?.success) {
        console.log('✅ Marked as transporting');
      }
    } catch (err) {
      console.error('❌ Transporting failed', err);
    }
  };

  const handleLocationUpdate = async () => {
    if (!onUpdateAmbulanceLocation || !ambulance || isUpdatingLocation) return;

    const baseLat = ambulance.currentLocation?.lat;
    const baseLng = ambulance.currentLocation?.lng;
    if (baseLat == null || baseLng == null) return setError('Missing ambulance location');

    setIsUpdatingLocation(true);
    try {
      const newLocation = {
        lat: baseLat + (Math.random() - 0.5) * 0.001,
        lng: baseLng + (Math.random() - 0.5) * 0.001
      };
      const result = await onUpdateAmbulanceLocation(ambulance.id, newLocation);
      if (result?.success) {
        setSuccess('Location updated!');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(result?.message || 'Update failed');
      }
    } catch (err) {
      setError(err?.message || 'Update failed');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const getEmergencyId = () => emergencyId?.slice(-6) || dispatchId?.slice(-6) || 'N/A';

  return (
    <div className={`border rounded-lg p-4 mb-4 shadow-sm ${currentStatus.color}`}>
      <div className="flex justify-between mb-2">
        <div className="flex gap-2 items-center">
          <AlertTriangle size={18} />
          <h3 className="font-semibold">Emergency #{getEmergencyId()}</h3>
          {emergency.priority && (
            <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[emergency.priority]}`}>
              {emergency.priority.toLowerCase()} priority
            </span>
          )}
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium px-2 py-1 rounded ${currentStatus.textColor}`}>
            {currentStatus.label}
          </span>
        </div>
      </div>

      {success && <p className="text-green-700 text-sm mb-2">{success}</p>}
      {error && <p className="text-red-700 text-sm mb-2">{error}</p>}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t mt-4">
        {onUpdateAmbulanceLocation && (
          <button
            onClick={handleLocationUpdate}
            disabled={isUpdatingLocation}
            className="bg-blue-600 text-white px-3 py-2 text-sm rounded hover:bg-blue-700"
          >
            {isUpdatingLocation ? 'Updating...' : 'Update Location'}
          </button>
        )}

        {['dispatched', 'en-route'].includes(normalizedStatus) && onMarkArrived && (
          <button
            onClick={handleMarkArrived}
            disabled={actionLoading['Mark Arrived']}
            className="bg-purple-600 text-white px-3 py-2 text-sm rounded hover:bg-purple-700"
          >
            {actionLoading['Mark Arrived'] ? 'Marking...' : 'Mark Arrived'}
          </button>
        )}

        {['arrived', 'arrived_at_emergency', 'busy'].includes(normalizedStatus) && onMarkTransporting && (
          <button
            onClick={handleMarkTransporting}
            disabled={actionLoading['Start Transport']}
            className="bg-yellow-600 text-white px-3 py-2 text-sm rounded hover:bg-yellow-700"
          >
            {actionLoading['Start Transport'] ? 'Starting...' : 'Start Transport'}
          </button>
        )}

        {['transporting', 'arrived_at_hospital'].includes(normalizedStatus) && onCompleteEmergency && (
          <button
            onClick={handleComplete}
            disabled={actionLoading['Complete Emergency']}
            className="bg-green-600 text-white px-3 py-2 text-sm rounded hover:bg-green-700"
          >
            {actionLoading['Complete Emergency'] ? 'Completing...' : 'Complete Emergency'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DispatchCard;
