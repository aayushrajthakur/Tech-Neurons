import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { socket } from '../../services/socket';
import ambulanceImg from '../../assets/ambulance.png';
import hospital_logo from '../../assets/hospital_logo.png';
import incidentImg from '../../assets/incident.png';
import { fetchHospitals } from '../../services/hospitalService';
import MapControls from './MapControls';

// Custom marker icons
const ambulanceIcon = new L.Icon({
  iconUrl: ambulanceImg,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const hospitalIcon = new L.Icon({
  iconUrl: hospital_logo,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
});

const incidentIcon = new L.Icon({
  iconUrl: incidentImg,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const MapView = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [etaCountdowns, setEtaCountdowns] = useState({});
  const [filters, setFilters] = useState({
    available: true,
    busy: true,
    hospitals: true,
    incidents: true,
  });

  const markerRefs = useRef({});

  useEffect(() => {
    const fetchActiveDispatches = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dispatch/active");
        const data = await res.json();
        if (Array.isArray(data)) setDispatches(data);
      } catch (err) {
        console.error("❌ Error fetching active dispatches:", err.message);
      }
    };
    fetchActiveDispatches();
  }, []);

  useEffect(() => {
    const fetchAmbulances = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/ambulance/status");
        const data = await res.json();
        const formatted = data.map((amb) => ({
          id: amb._id,
          ambulance_id: amb.ambulance_id,
          driverName: amb.driverName,
          lat: amb.currentLocation.lat,
          lng: amb.currentLocation.lng,
          status: amb.status,
          speed: amb.speed || 0,
          eta: amb.eta || null,
        }));
        setAmbulances(formatted);
      } catch (err) {
        console.error("❌ Error fetching ambulances:", err.message);
      }
    };
    fetchAmbulances();
  }, []);

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/emergency");
        const result = await res.json();
        const emergencies = Array.isArray(result.data) ? result.data : [];
        const filtered = emergencies.filter((e) =>
          ["pending", "dispatched"].includes(e.status)
        );
        const formatted = filtered.map((e) => ({
          lat: e.location.lat,
          lng: e.location.lng,
          type: e.category,
          severity: e.priority,
          time: e.timestamp,
        }));
        setIncidents(formatted);
      } catch (err) {
        console.error("❌ Error fetching emergencies:", err.message);
      }
    };
    fetchEmergencies();
  }, []);

  // Socket.IO Listeners
  useEffect(() => {
    const handleAmbulanceLocationUpdate = (data) => {
      setAmbulances(data);
    };

    const handleAmbulanceStatusUpdate = (data) => {
      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === data.ambulanceId ? { ...a, status: data.newStatus } : a
        )
      );
    };

    const handleAmbulanceLocationSingle = (data) => {
      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === data.ambulanceId
            ? { ...a, lat: data.location.lat, lng: data.location.lng }
            : a
        )
      );
    };

    const handleHospitalUpdate = (data) => {
      setHospitals((prev) => {
        const exists = prev.some((h) => h.hospital_id === data.hospital_id);
        return exists
          ? prev.map((h) => (h.hospital_id === data.hospital_id ? data : h))
          : [...prev, data];
      });
    };

    const handleIncidentReported = (data) => {
      setIncidents((prev) => [...prev, data]);
    };

    const handleEmergencyStatusUpdated = (data) => {
      if (data.newStatus === 'resolved') {
        setIncidents((prev) =>
          prev.filter((inc) => inc._id !== data.emergencyId)
        );
      }
    };

    const handleAmbulanceDispatched = (data) => {
      setDispatches((prev) => {
        const updated = prev.filter((d) => d.ambulanceId !== data.ambulanceId);
        return [...updated, data];
      });
    };

    const handleDispatchCompleted = (data) => {
      setDispatches((prev) =>
        prev.filter((d) => d.ambulanceId !== data.ambulanceId)
      );
    };

    socket.on('ambulanceLocationUpdate', handleAmbulanceLocationUpdate);
    socket.on('ambulance-status-updated', handleAmbulanceStatusUpdate);
    socket.on('ambulance-location-updated', handleAmbulanceLocationSingle);
    socket.on('hospitalUpdate', handleHospitalUpdate);
    socket.on('incidentReported', handleIncidentReported);
    socket.on('emergency-status-updated', handleEmergencyStatusUpdated);
    socket.on('ambulanceDispatched', handleAmbulanceDispatched);
    socket.on('ambulance-dispatched', handleAmbulanceDispatched);
    socket.on('dispatchCompleted', handleDispatchCompleted);
    socket.on('dispatchCancelled', handleDispatchCompleted);

    return () => {
      socket.off('ambulanceLocationUpdate', handleAmbulanceLocationUpdate);
      socket.off('ambulance-status-updated', handleAmbulanceStatusUpdate);
      socket.off('ambulance-location-updated', handleAmbulanceLocationSingle);
      socket.off('hospitalUpdate', handleHospitalUpdate);
      socket.off('incidentReported', handleIncidentReported);
      socket.off('emergency-status-updated', handleEmergencyStatusUpdated);
      socket.off('ambulanceDispatched', handleAmbulanceDispatched);
      socket.off('ambulance-dispatched', handleAmbulanceDispatched);
      socket.off('dispatchCompleted', handleDispatchCompleted);
      socket.off('dispatchCancelled', handleDispatchCompleted);
    };
  }, []);

  useEffect(() => {
    const loadHospitals = async () => {
      const data = await fetchHospitals();
      setHospitals(data);
    };
    loadHospitals();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCountdowns = {};
      dispatches.forEach((d) => {
        const eta = new Date(d.estimatedArrival).getTime();
        const diff = Math.max(0, eta - now);
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        newCountdowns[d.ambulanceId] = `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
      });
      setEtaCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [dispatches]);

  useEffect(() => {
    ambulances.forEach((amb) => {
      const ref = markerRefs.current[amb.id];
      if (ref) {
        ref.setLatLng([amb.lat, amb.lng]);
      }
    });
  }, [ambulances]);

  const getPolylineStyle = (dispatch) => {
    const baseStyle = { weight: 4, opacity: 0.8 };
    switch (dispatch.status) {
      case 'dispatched':
        return { ...baseStyle, color: '#ff4444', dashArray: '10, 5' };
      case 'en_route_to_hospital':
        return { ...baseStyle, color: '#ff8800', dashArray: '15, 5' };
      case 'arrived_at_emergency':
        return { ...baseStyle, color: '#ffaa00', dashArray: '20, 5' };
      default:
        return { ...baseStyle, color: '#888888', dashArray: '5, 5' };
    }
  };

  return (
    <div className="relative h-[80vh] w-full">
      <MapControls filters={filters} setFilters={setFilters} />
      <MapContainer
        center={[22.3, 73.1]}
        zoom={12}
        className="h-full w-full rounded-xl shadow-md z-0"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {ambulances.map((amb) => {
          if (
            (amb.status === 'available' && !filters.available) ||
            (amb.status === 'busy' && !filters.busy)
          ) return null;

          return (
            <Marker
              key={amb.id}
              position={[amb.lat, amb.lng]}
              icon={ambulanceIcon}
              ref={(ref) => { if (ref) markerRefs.current[amb.id] = ref; }}
            >
              <Popup>
                <strong>ID:</strong> {amb.ambulance_id}<br />
                <strong>Driver:</strong> {amb.driverName}<br />
                <strong>Status:</strong> {amb.status}<br />
                <strong>Speed:</strong> {amb.speed?.toFixed(1)} km/h<br />
                <strong>ETA:</strong> {amb.eta ? Math.ceil(amb.eta / 60) + " min" : "N/A"}
              </Popup>
            </Marker>
          );
        })}

        {filters.hospitals && hospitals.map((hos) => (
          <Marker
            key={hos.hospital_id}
            position={[hos.location.lat, hos.location.lng]}
            icon={hospitalIcon}
          >
            <Popup>
              🏥 <b>{hos.name}</b><br />
              Load: {hos.load}%<br />
              Specialties: {hos.specialties.join(', ')}
            </Popup>
          </Marker>
        ))}

        {filters.incidents && incidents.map((inc, idx) => (
          <Marker key={idx} position={[inc.lat, inc.lng]} icon={incidentIcon}>
            <Popup>
              🚨 <b>Incident</b><br />
              Type: {inc.type || 'Unknown'}<br />
              Severity: {inc.severity || 'Moderate'}
            </Popup>
          </Marker>
        ))}

        {dispatches.map((d, index) => {
          const eta = etaCountdowns[d.ambulanceId] || null;
          const polylineStyle = getPolylineStyle(d);
          const routePath = [];

          if (d.ambulanceLocation) {
            routePath.push([d.ambulanceLocation.lat, d.ambulanceLocation.lng]);
          }
          if (d.emergencyLocation && ['dispatched'].includes(d.status)) {
            routePath.push([d.emergencyLocation.lat, d.emergencyLocation.lng]);
          }
          if (d.hospitalLocation) {
            routePath.push([d.hospitalLocation.lat, d.hospitalLocation.lng]);
          }

          return (
            <div key={`dispatch-${d.ambulanceId}-${index}`}>
              {routePath.length > 1 && (
                <Polyline positions={routePath} pathOptions={polylineStyle} />
              )}
              {eta && (
                <Marker
                  position={
                    ['dispatched'].includes(d.status)
                      ? [d.emergencyLocation.lat, d.emergencyLocation.lng]
                      : [d.hospitalLocation.lat, d.hospitalLocation.lng]
                  }
                  icon={L.divIcon({
                    className: 'leaflet-eta-label',
                    html: `<div style="
                      background: rgba(255,255,255,0.95);
                      padding: 8px;
                      border-radius: 8px;
                      border: 2px solid ${polylineStyle.color};
                      font-size: 11px;
                      font-weight: bold;
                      color: #333;
                      text-align: center;
                    ">
                      <div style="font-size: 9px;">ETA</div>
                      ${eta}
                    </div>`,
                    iconSize: [70, 40],
                    iconAnchor: [35, 20],
                  })}
                />
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
