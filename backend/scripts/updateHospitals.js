// scripts/updateAmbulances.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Hospital = require("../models/Hospital"); // path to your Ambulance model

dotenv.config();

const updatedHospitals = [
  {
    hospital_id: "HOSP001",
    name: "CityCare Hospital",
    location: { lat: 22.3115, lng: 73.1812 },
    specialties: ["cardiology", "emergency"],
    load: 60
  },
  {
    hospital_id: "HOSP002",
    name: "Sunrise Medical Center",
    location: { lat: 22.3024, lng: 73.1721 },
    specialties: ["orthopedics", "trauma"],
    load: 45
  },
  {
    hospital_id: "HOSP003",
    name: "LifeLine Hospital",
    location: { lat: 22.2889, lng: 73.1645 },
    specialties: ["neurology", "cardiology"],
    load: 75
  },
  {
    hospital_id: "HOSP004",
    name: "GreenLeaf Hospital",
    location: { lat: 22.2964, lng: 73.2075 },
    specialties: ["pediatrics", "general"],
    load: 30
  },
  {
    hospital_id: "HOSP005",
    name: "Medilink Hospital",
    location: { lat: 22.3234, lng: 73.1857 },
    specialties: ["surgery", "intensive care"],
    load: 85
  },
  {
    hospital_id: "HOSP006",
    name: "Global City Hospital",
    location: { lat: 22.3156, lng: 73.1456 },
    specialties: ["gynecology", "emergency"],
    load: 50
  },
  {
    hospital_id: "HOSP007",
    name: "Apex Healthcare",
    location: { lat: 22.3328, lng: 73.1933 },
    specialties: ["cardiology", "nephrology"],
    load: 40
  },
  {
    hospital_id: "HOSP008",
    name: "Silverline Hospital",
    location: { lat: 22.2953, lng: 73.1582 },
    specialties: ["ENT", "surgery"],
    load: 55
  },
  {
    hospital_id: "HOSP009",
    name: "Hope Wellness Center",
    location: { lat: 22.3072, lng: 73.2024 },
    specialties: ["psychiatry", "general"],
    load: 20
  },
  {
    hospital_id: "HOSP010",
    name: "Trinity Hospital",
    location: { lat: 22.3197, lng: 73.1764 },
    specialties: ["orthopedics", "neurology"],
    load: 70
  },
  {
    hospital_id: "HOSP011",
    name: "Shree Krishna Hospital",
    location: { lat: 22.3051, lng: 73.1793 },
    specialties: ["trauma", "emergency"],
    load: 65
  },
  {
    hospital_id: "HOSP012",
    name: "Vedant Multi-Speciality",
    location: { lat: 22.3145, lng: 73.1894 },
    specialties: ["cardiology", "burns"],
    load: 50
  },
  {
    hospital_id: "HOSP013",
    name: "Nisarg Hospital",
    location: { lat: 22.3351, lng: 73.2028 },
    specialties: ["intensive care", "general"],
    load: 35
  },
  {
    hospital_id: "HOSP014",
    name: "Samarpan Hospital",
    location: { lat: 22.2988, lng: 73.1402 },
    specialties: ["trauma", "surgery"],
    load: 60
  },
  {
    hospital_id: "HOSP015",
    name: "Jivraj Hospital",
    location: { lat: 22.2879, lng: 73.1903 },
    specialties: ["burns", "emergency"],
    load: 42
  },
  {
    hospital_id: "HOSP016",
    name: "Rudraksh Hospital",
    location: { lat: 22.3102, lng: 73.2101 },
    specialties: ["orthopedics", "trauma"],
    load: 58
  },
  {
    hospital_id: "HOSP017",
    name: "Mahavir Hospital",
    location: { lat: 22.3306, lng: 73.1491 },
    specialties: ["cardiology", "surgery"],
    load: 67
  },
  {
    hospital_id: "HOSP018",
    name: "Unity Hospital",
    location: { lat: 22.3017, lng: 73.1624 },
    specialties: ["emergency", "general"],
    load: 33
  },
  {
    hospital_id: "HOSP019",
    name: "Vraj Hospital",
    location: { lat: 22.3184, lng: 73.1543 },
    specialties: ["cardiology", "neurology"],
    load: 48
  },
  {
    hospital_id: "HOSP020",
    name: "Relief Trauma Center",
    location: { lat: 22.2976, lng: 73.1839 },
    specialties: ["trauma", "emergency"],
    load: 69
  }
];



const updateHospitals = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://yashmachhi1408:YAatlas%401408@cluster0.nuz5b2l.mongodb.net/ers2?retryWrites=true&w=majority");
    console.log("✅ Connected to MongoDB");

    for (const amb of updatedHospitals) {
      await Hospital.updateOne(
        { hospital_id: amb.hospital_id },
        { $set: amb },
        { upsert: true } // This will insert if not found
      );
    }

    console.log("🚑 Hospital data updated or inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Update failed:", err.message);
    process.exit(1);
  }
};

updateHospitals();
