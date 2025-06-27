// scripts/cleanupInvalidAmbulances.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Ambulance = require('../models/Ambulance');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://yashmachhi1408:YAatlas%401408@cluster0.nuz5b2l.mongodb.net/ers2?retryWrites=true&w=majority'; // adjust if needed

async function cleanupInvalidAmbulances() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const result = await Ambulance.updateMany(
      {
        status: { $in: ['dispatched', 'transporting', 'busy'] },
        $or: [
          { 'destination.location': { $exists: false } },
          { 'destination.location.lat': { $exists: false } },
          { 'destination.location.lng': { $exists: false } },
          { 'destination.location.lat': { $type: 'null' } },
          { 'destination.location.lng': { $type: 'null' } }
        ]
      },
      {
        $set: {
          status: 'available',
          currentEmergency: null,
          destination: {}
        }
      }
    );

    console.log(`✅ Cleanup complete: ${result.modifiedCount} ambulance(s) reset to available`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
}

cleanupInvalidAmbulances();
