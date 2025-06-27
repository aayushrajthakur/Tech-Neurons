const Ambulance = require('../models/Ambulance');
const Emergency = require('../models/Emergency');
const Hospital = require('../models/Hospital');
const { getSocketInstance } = require('../socket/socketHandler');

function moveTowards(current, target, speed = 0.0005) {
  const latDiff = target.lat - current.lat;
  const lngDiff = target.lng - current.lng;
  const distance = Math.sqrt(latDiff ** 2 + lngDiff ** 2);
  if (distance < speed) return target;
  return {
    lat: current.lat + (latDiff / distance) * speed,
    lng: current.lng + (lngDiff / distance) * speed
  };
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const startAmbulanceTracking = () => {
  console.log('🚑 Starting ambulance tracking service...');

  setInterval(async () => {
    try {
      const io = getSocketInstance();
      const ambulances = await Ambulance.find({
        status: { $in: ['dispatched', 'busy', 'transporting'] }
      });

      const updatedAmbulances = [];

      for (let amb of ambulances) {
        let destination = null;

        if (amb.status === 'dispatched') {
          destination = amb.destination?.location;
        } else if (amb.status === 'busy') {
          updatedAmbulances.push({
            id: amb._id,
            ambulance_id: amb.ambulance_id,
            driverName: amb.driverName,
            lat: amb.currentLocation.lat,
            lng: amb.currentLocation.lng,
            status: amb.status,
            speed: 0
          });
          continue;
        } else if (amb.status === 'transporting') {
          destination = amb.destination?.hospitalLocation;
        }

        if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
          console.error(`❌ Invalid destination for ambulance ${amb.ambulance_id}`);
          continue;
        }

        const oldLat = amb.currentLocation.lat;
        const oldLng = amb.currentLocation.lng;
        const oldTime = Date.now();

        const distance = calculateDistance(oldLat, oldLng, destination.lat, destination.lng);

        if (distance < 0.05) {
          amb.currentLocation = destination;

          if (amb.status === 'dispatched') {
            amb.status = 'busy';
            await amb.save();

            const emergency = await Emergency.findById(amb.currentEmergency);
            if (emergency) {
              emergency.status = 'arrived_at_emergency';
              await emergency.save();

              io.emit('emergency-status-updated', {
                emergencyId: emergency._id,
                newStatus: 'arrived_at_emergency'
              });
            }

            io.emit('ambulance-status-updated', {
              ambulanceId: amb._id,
              ambulance_id: amb.ambulance_id,
              newStatus: 'busy'
            });

            io.emit('ambulance-location-updated', {
              ambulanceId: amb._id,
              ambulance_id: amb.ambulance_id,
              location: amb.currentLocation,
              speed: 0
            });

            console.log(`✅ Ambulance ${amb.ambulance_id} arrived at emergency and is now BUSY`);

          } else if (amb.status === 'transporting') {
            // 🆕 STEP: Mark arrived at hospital
            amb.status = 'arrived_at_hospital';
            await amb.save();

            const emergency = await Emergency.findById(amb.currentEmergency);
            if (emergency) {
              emergency.status = 'arrived_at_hospital';
              await emergency.save();

              io.emit('emergency-status-updated', {
                emergencyId: emergency._id,
                newStatus: 'arrived_at_hospital'
              });
            }

            io.emit('ambulance-status-updated', {
              ambulanceId: amb._id,
              ambulance_id: amb.ambulance_id,
              newStatus: 'arrived_at_hospital'
            });

            io.emit('ambulance-location-updated', {
              ambulanceId: amb._id,
              ambulance_id: amb.ambulance_id,
              location: amb.currentLocation,
              speed: 0
            });

            console.log(`✅ Ambulance ${amb.ambulance_id} arrived at hospital`);

            // Wait 3 seconds before resolving (optional)
            setTimeout(async () => {
              amb.status = 'available';
              amb.currentEmergency = null;
              amb.destination = null;
              await amb.save();

              if (emergency) {
                emergency.status = 'resolved';
                await emergency.save();

                io.emit('emergency-status-updated', {
                  emergencyId: emergency._id,
                  newStatus: 'resolved'
                });
              }

              const hospital = await Hospital.findById(amb.destination?.hospitalId);
              if (hospital && hospital.load < 95) {
                hospital.load += 5;
                await hospital.save();
                io.emit('hospitalUpdate', hospital);
              }

              io.emit('ambulance-status-updated', {
                ambulanceId: amb._id,
                ambulance_id: amb.ambulance_id,
                newStatus: 'available'
              });

              console.log(`✅ Ambulance ${amb.ambulance_id} completed transport and is now AVAILABLE`);
            }, 3000);
          }

          updatedAmbulances.push({
            id: amb._id,
            ambulance_id: amb.ambulance_id,
            driverName: amb.driverName,
            lat: amb.currentLocation.lat,
            lng: amb.currentLocation.lng,
            status: amb.status,
            speed: 0
          });

          continue;
        }

        const newLocation = moveTowards(amb.currentLocation, destination);
        amb.currentLocation = newLocation;
        await amb.save();

        const newLat = newLocation.lat;
        const newLng = newLocation.lng;
        const newTime = Date.now();
        const movedDist = calculateDistance(oldLat, oldLng, newLat, newLng);
        const timeSec = (newTime - oldTime) / 1000;
        const speed = timeSec > 0 ? (movedDist / (timeSec / 3600)) : 0;

        io.emit('ambulance-location-updated', {
          ambulanceId: amb._id,
          ambulance_id: amb.ambulance_id,
          location: amb.currentLocation,
          speed: parseFloat(speed.toFixed(1))
        });

        updatedAmbulances.push({
          id: amb._id,
          ambulance_id: amb.ambulance_id,
          driverName: amb.driverName,
          lat: amb.currentLocation.lat,
          lng: amb.currentLocation.lng,
          status: amb.status,
          speed: parseFloat(speed.toFixed(1))
        });

        console.log(`🚑 Moving ambulance ${amb.ambulance_id} (${amb.status})`);
      }

      if (updatedAmbulances.length > 0) {
        io.emit('ambulanceLocationUpdate', updatedAmbulances);
      }

    } catch (err) {
      console.error('❌ Ambulance tracking error:', err);
    }
  }, 3000);
};

module.exports = startAmbulanceTracking;
