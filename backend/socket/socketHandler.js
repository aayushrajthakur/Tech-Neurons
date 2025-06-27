const Ambulance = require('../models/Ambulance');

let ioInstance = null;

const setSocketInstance = (io) => {
  ioInstance = io;

  io.on('connection', async (socket) => {
    console.log('🟢 Client connected:', socket.id);

    try {
      const ambulances = await Ambulance.find();

      const formattedData = ambulances.map((amb) => ({
        id: amb._id,
        ambulance_id: amb.ambulance_id,
        lat: amb.currentLocation.lat,
        lng: amb.currentLocation.lng,
        status: amb.status,
        driverName: amb.driverName,
      }));

      socket.emit('ambulanceLocationUpdate', formattedData);
      console.log('📡 Sent initial ambulance data to', socket.id);
    } catch (err) {
      console.error('❌ Error on initial fetch:', err.message);
    }

    socket.on('incidentReported', (data) => {
      console.log('🚨 Received incident from client:', data);
      io.emit('incidentReported', data);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Disconnected:', socket.id);
    });
  });

  // Update ambulance locations every 5 seconds
  setInterval(async () => {
    try {
      const ambulances = await Ambulance.find(); // ✅ Fetch ALL ambulances

      const updatedAmbulances = await Promise.all(
        ambulances.map(async (amb) => {
          // ✅ Simulate movement only for dispatched ambulances
          if (amb.status === 'dispatched') {
            const latShift = (Math.random() - 0.5) * 0.001;
            const lngShift = (Math.random() - 0.5) * 0.001;

            amb.currentLocation.lat += latShift;
            amb.currentLocation.lng += lngShift;
            await amb.save();
          }

          return {
            id: amb._id,
            ambulance_id: amb.ambulance_id,
            lat: amb.currentLocation.lat,
            lng: amb.currentLocation.lng,
            status: amb.status,
            driverName: amb.driverName,
          };
        })
      );

      // ✅ Emit all ambulance data (updated + static)
      io.emit('ambulanceLocationUpdate', updatedAmbulances);
      console.log(`📡 Emitted location for ${updatedAmbulances.length} ambulances`);
    } catch (err) {
      console.error('❌ Error updating ambulance locations:', err.message);
    }
  }, 5000);
};

const getSocketInstance = () => {
  if (!ioInstance) throw new Error('Socket.IO instance not initialized');
  return ioInstance;
};

module.exports = {
  setSocketInstance,
  getSocketInstance,
};
