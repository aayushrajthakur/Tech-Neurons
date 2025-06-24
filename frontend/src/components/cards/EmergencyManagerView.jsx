import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs";
import DispatchCard from "../cards/DispatchCard";
import EmergencyCard from "../cards/EmergencyCard";
import { socket } from "../../services/socket";

const EmergencyManagerView = ({ 
  dispatches = [], 
  pendingEmergencies = [], 
  resolvedEmergencies = [], 
  onRefreshData 
}) => {
  const [liveDispatches, setLiveDispatches] = useState(dispatches);
  const [livePendingEmergencies, setLivePendingEmergencies] = useState(pendingEmergencies);
  const [liveResolvedEmergencies, setLiveResolvedEmergencies] = useState(resolvedEmergencies);

  // Update state when props change
  useEffect(() => {
    setLiveDispatches(dispatches);
    setLivePendingEmergencies(pendingEmergencies);
    setLiveResolvedEmergencies(resolvedEmergencies);
  }, [dispatches, pendingEmergencies, resolvedEmergencies]);

  // Socket event handlers
  useEffect(() => {
    // Handle new dispatch
    const handleNewDispatch = (dispatch) => {
      setLiveDispatches(prev => [dispatch, ...prev]);
    };

    // Handle dispatch update
    const handleDispatchUpdate = (updatedDispatch) => {
      setLiveDispatches(prev => 
        prev.map(dispatch => 
          dispatch.id === updatedDispatch.id ? updatedDispatch : dispatch
        )
      );
    };

    // Handle new emergency
    const handleNewEmergency = (emergency) => {
      setLivePendingEmergencies(prev => [emergency, ...prev]);
    };

    // Handle emergency status update
    const handleEmergencyUpdate = (updatedEmergency) => {
      if (updatedEmergency.status === 'resolved') {
        // Move from pending to resolved
        setLivePendingEmergencies(prev => 
          prev.filter(emergency => emergency.id !== updatedEmergency.id)
        );
        setLiveResolvedEmergencies(prev => [updatedEmergency, ...prev]);
      } else {
        // Update in pending list
        setLivePendingEmergencies(prev => 
          prev.map(emergency => 
            emergency.id === updatedEmergency.id ? updatedEmergency : emergency
          )
        );
      }
    };

    // Handle emergency deletion
    const handleEmergencyDeleted = (emergencyId) => {
      setLivePendingEmergencies(prev => 
        prev.filter(emergency => emergency.id !== emergencyId)
      );
      setLiveResolvedEmergencies(prev => 
        prev.filter(emergency => emergency.id !== emergencyId)
      );
    };

    // Register socket listeners
    socket.on('dispatch:new', handleNewDispatch);
    socket.on('dispatch:updated', handleDispatchUpdate);
    socket.on('emergency:new', handleNewEmergency);
    socket.on('emergency:updated', handleEmergencyUpdate);
    socket.on('emergency:deleted', handleEmergencyDeleted);

    // Cleanup listeners on unmount
    return () => {
      socket.off('dispatch:new', handleNewDispatch);
      socket.off('dispatch:updated', handleDispatchUpdate);
      socket.off('emergency:new', handleNewEmergency);
      socket.off('emergency:updated', handleEmergencyUpdate);
      socket.off('emergency:deleted', handleEmergencyDeleted);
    };
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    if (onRefreshData) {
      onRefreshData();
    }
  };

  return (
    <div className="emergency-manager-view">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Management</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <Tabs defaultValue="dispatches" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dispatches" className="relative">
            Active Dispatches
            {liveDispatches.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {liveDispatches.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Emergencies
            {livePendingEmergencies.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                {livePendingEmergencies.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="relative">
            Resolved Emergencies
            {liveResolvedEmergencies.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                {liveResolvedEmergencies.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dispatches" className="mt-6">
          <div className="space-y-4">
            {liveDispatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🚨</div>
                <h3 className="text-lg font-medium mb-2">No Active Dispatches</h3>
                <p>All emergency units are currently available</p>
              </div>
            ) : (
              liveDispatches.map((dispatch) => (
                <DispatchCard 
                  key={dispatch.id} 
                  dispatch={dispatch} 
                  onUpdate={handleRefresh}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {livePendingEmergencies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-medium mb-2">No Pending Emergencies</h3>
                <p>All emergencies have been addressed</p>
              </div>
            ) : (
              livePendingEmergencies.map((emergency) => (
                <EmergencyCard 
                  key={emergency.id} 
                  emergency={emergency} 
                  onUpdate={handleRefresh}
                  isPending={true}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="mt-6">
          <div className="space-y-4">
            {liveResolvedEmergencies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">No Resolved Emergencies</h3>
                <p>Resolved emergencies will appear here</p>
              </div>
            ) : (
              liveResolvedEmergencies.map((emergency) => (
                <EmergencyCard 
                  key={emergency.id} 
                  emergency={emergency} 
                  onUpdate={handleRefresh}
                  isPending={false}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmergencyManagerView;