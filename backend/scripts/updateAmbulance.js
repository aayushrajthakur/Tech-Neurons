// scripts/updateAmbulances.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Ambulance = require("../models/Ambulance"); // path to your Ambulance model

dotenv.config();

const updatedAmbulances = [
  {
    ambulance_id: "AMB001",
    driverName: "Ajay",
    currentLocation: { lat: 22.3091, lng: 73.1819 },
    status: "available"
  },
  {
    ambulance_id: "AMB002",
    driverName: "Raj Patel",
    currentLocation: { lat: 22.3158, lng: 73.1752 },
    status: "available"
  },
  {
    ambulance_id: "AMB003",
    driverName: "Karan Joshi",
    currentLocation: { lat: 22.2973, lng: 73.1917 },
    status: "available"
  },
  {
    ambulance_id: "AMB004",
    driverName: "Mitesh Desai",
    currentLocation: { lat: 22.3261, lng: 73.1982 },
    status: "available"
  },
  {
    ambulance_id: "AMB005",
    driverName: "Harshil Mehta",
    currentLocation: { lat: 22.2855, lng: 73.1618 },
    status: "available"
  },
  {
    ambulance_id: "AMB006",
    driverName: "Deep Trivedi",
    currentLocation: { lat: 22.3084, lng: 73.2120 },
    status: "available"
  },
  {
    ambulance_id: "AMB007",
    driverName: "Vivek Chauhan",
    currentLocation: { lat: 22.3374, lng: 73.1946 },
    status: "available"
  },
  {
    ambulance_id: "AMB008",
    driverName: "Rakesh Bhatt",
    currentLocation: { lat: 22.3122, lng: 73.1401 },
    status: "available"
  },
  {
    ambulance_id: "AMB009",
    driverName: "Saurabh Panchal",
    currentLocation: { lat: 22.2885, lng: 73.1786 },
    status: "available"
  },
  {
    ambulance_id: "AMB010",
    driverName: "Jignesh Rana",
    currentLocation: { lat: 22.3199, lng: 73.1667 },
    status: "available"
  }


];

const updateAmbulances = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://yashmachhi1408:YAatlas%401408@cluster0.nuz5b2l.mongodb.net/ers2?retryWrites=true&w=majority");
    console.log("✅ Connected to MongoDB");

    for (const amb of updatedAmbulances) {
      await Ambulance.updateOne(
        { ambulance_id: amb.ambulance_id },
        { $set: amb },
        { upsert: true } // This will insert if not found
      );
    }

    console.log("🚑 Ambulance data updated or inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Update failed:", err.message);
    process.exit(1);
  }
};

updateAmbulances();
