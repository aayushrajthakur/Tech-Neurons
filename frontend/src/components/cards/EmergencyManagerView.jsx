import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs";
import DispatchCard from "../cards/DispatchCard";
import EmergencyCard from "../cards/EmergencyCard";

const EmergencyManagerView = ({
  dispatches = [],
  pendingEmergencies = [],
  resolvedEmergencies = [],
  stats = {},
  loading,
  error,
  onRefreshData,
  onDispatchEmergency,
  onMarkArrived,
  onMarkTransporting,
  onMarkArrivedAtHospital, // ✅ NEW
  onCompleteEmergency,
  onUpdateAmbulanceLocation
}) => {
  if (error) {
    return (
      <div className="emergency-manager-view px-6 py-4 max-w-6xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={onRefreshData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="emergency-manager-view px-6 py-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Manager</h1>
        <button
          onClick={onRefreshData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Active Dispatches</p>
          <p className="text-xl font-bold text-blue-600">
            {stats.activeDispatches || dispatches.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-xl font-bold text-green-600">
            {stats.completedToday || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Pending Emergencies</p>
          <p className="text-xl font-bold text-orange-600">
            {pendingEmergencies.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Avg. Response Time</p>
          <p className="text-xl font-bold text-purple-600">
            {stats.averageResponseTime || 0}m
          </p>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}

      {/* Tabbed View */}
      <Tabs defaultValue="dispatches" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dispatches">
            Dispatches
            {dispatches.length > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {dispatches.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingEmergencies.length > 0 && (
              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                {pendingEmergencies.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
            {resolvedEmergencies.length > 0 && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {resolvedEmergencies.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Dispatches */}
        <TabsContent value="dispatches" className="space-y-4">
          {dispatches.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🚑</div>
              <p>No active dispatches</p>
            </div>
          ) : (
            dispatches.map((dispatch) => (
              <DispatchCard
                key={dispatch._id}
                dispatch={dispatch}
                onUpdate={onRefreshData}
                onMarkArrived={onMarkArrived}
                onMarkTransporting={onMarkTransporting}
                onCompleteEmergency={onCompleteEmergency}
                onUpdateAmbulanceLocation={onUpdateAmbulanceLocation}
              />
            ))
          )}
        </TabsContent>

        {/* Pending Emergencies (grouped by status) */}
        <TabsContent value="pending" className="space-y-4">
          {pendingEmergencies.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🆘</div>
              <p>No pending emergencies</p>
            </div>
          ) : (
            ['pending', 'dispatched', 'arrived_at_emergency', 'transporting', 'arrived_at_hospital'].map((statusKey) => {
              const group = pendingEmergencies.filter((e) => e.status === statusKey);

              if (group.length === 0) return null;

              return (
                <div key={statusKey} className="mb-6">
                  <h3 className="text-lg font-semibold capitalize mb-2">
                    {statusKey.replace(/_/g, ' ')} ({group.length})
                  </h3>
                  <div className="space-y-4">
                    {group.map((emergency) => (
                      <EmergencyCard
                        key={emergency._id}
                        emergency={emergency}
                        onUpdate={onRefreshData}
                        onDispatchEmergency={onDispatchEmergency}
                        onMarkArrived={onMarkArrived}
                        onMarkTransporting={onMarkTransporting}
                        onMarkArrivedAtHospital={onMarkArrivedAtHospital} 
                        onCompleteEmergency={onCompleteEmergency}
                        isPending={true}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Resolved Emergencies */}
        <TabsContent value="resolved" className="space-y-4">
          {resolvedEmergencies.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📋</div>
              <p>No resolved emergencies yet</p>
            </div>
          ) : (
            resolvedEmergencies.map((emergency) => (
              <EmergencyCard
                key={emergency._id}
                emergency={emergency}
                onUpdate={onRefreshData}
                onMarkArrived={onMarkArrived}
                onMarkTransporting={onMarkTransporting}
                onMarkArrivedAtHospital={onMarkArrivedAtHospital} 
                onCompleteEmergency={onCompleteEmergency}
                isPending={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmergencyManagerView;
