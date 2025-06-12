# 🚑 ERS-2: AI-Powered Smart Ambulance Dispatcher

**TechNeurons Hackathon Project – Emergency Response System**

---

## 📌 Overview

ERS-2 is an intelligent, AI-powered ambulance dispatch system designed to optimize emergency response using:
- Voice-based emergency detection
- Real-time ambulance tracking
- AI-based hospital and ambulance dispatch logic
- Predictive emergency hotspot mapping

The project is built using the MERN stack for the core system and Python for AI components.

---

## 🧠 Features

- 🎙️ **Voice AI Emergency Detection** – Converts emergency voice calls to text and classifies urgency using NLP.
- 🗺️ **Real-Time Ambulance Tracking** – Live ambulance locations with traffic-aware routing.
- 🏥 **AI-Powered Dispatch** – Matches emergency with the best ambulance and hospital based on traffic, location, and specialties.
- 🔥 **Hotspot Prediction** – Predicts future emergency-prone areas using past data and displays as a heatmap.
- ⚡ **Socket.IO Integration** – Real-time alert system for instant updates to dashboard.

---

## 🧰 Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Leaflet.js + OpenStreetMap

### Backend
- Node.js + Express.js
- MongoDB Atlas
- Socket.IO

### AI Service (Python)
- Whisper (Speech-to-Text)
- spaCy / scikit-learn (NLP)
- Flask (REST API)

---

## 📁 Folder Structure

ERS2-Smart-Ambulance/
├── backend/ # Node.js + Express APIs
├── frontend/ # React Dashboard with Map + Alerts
├── ai-service/ # Python Flask AI modules


---

## 🚀 How to Run

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
2. Frontend
```bash
cd frontend
npm install
npm run dev
```
3. AI Service (Python)
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```
🌐 API Endpoints
Backend (Express)
POST /emergency – Create emergency entry

GET /emergency – Get all emergencies

POST /dispatch – Run dispatch AI logic

GET /ambulance – Get live ambulance data

GET /heatmap – Get predicted emergency zones

AI Service (Flask)
POST /classify – Classify emergency priority from audio

POST /dispatch-ai – Suggest best ambulance & hospital

📊 Demo Features
Real-time emergency feed and alerts

Ambulance route visualization on map

Heatmap overlays of predicted emergencies

Simulation mode for emergency testing

👨‍💻 Team Roles

Yash Machhi – Frontend + Backend (Full MERN stack)

Dipesh Chaudhary – AI Voice/NLP & Flask API

Aayush Raj Thakur – Dispatch Logic & Predictive Mapping

Vridhi Taory - Management & Presentation 

📃 License
MIT License – Feel free to reuse or build on this project for educational purposes.

🤝 Contributions
Pull requests and issues are welcome!



