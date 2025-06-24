import React from "react";
import ambulanceIcon from '../../assets/ambulance.png';
import hospitalIcon from '../../assets/hospital_logo.png';
import incidentIcon from '../../assets/incident.png';

const MapControls = ({ filters, setFilters }) => {
  const toggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-xl shadow-xl z-[1000] text-sm space-y-3">
      <h2 className="font-bold text-base">🗺️ Map Filters</h2>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={filters.available}
          onChange={() => toggleFilter('available')}
        />
        <span>Available Ambulances</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={filters.busy}
          onChange={() => toggleFilter('busy')}
        />
        <span>Busy Ambulances</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={filters.hospitals}
          onChange={() => toggleFilter('hospitals')}
        />
        <span>Hospitals</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={filters.incidents}
          onChange={() => toggleFilter('incidents')}
        />
        <span>Incidents</span>
      </label>

      <hr className="my-2" />

      <div className="text-xs space-y-1">
        <p className="flex items-center gap-2">
          <img src={ambulanceIcon} alt="Available Ambulance" className="w-5 h-5" />
          Available Ambulance
        </p>
        <p className="flex items-center gap-2">
          <img src={ambulanceIcon} alt="Busy Ambulance" className="w-5 h-5 opacity-50" />
          Busy Ambulance
        </p>
        <p className="flex items-center gap-2">
          <img src={hospitalIcon} alt="Hospital" className="w-6 h-6" />
          Hospital
        </p>
        <p className="flex items-center gap-2">
          <img src={incidentIcon} alt="Incident" className="w-5 h-5" />
          Incident
        </p>
      </div>
    </div>
  );
};

export default MapControls;
