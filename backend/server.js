// server.js - ERS-2 Backend Main Entry Point

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIO = require("socket.io");
const dashboardController = require("./controllers/dashboardController");
// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

// Attach io instance to app
app.set("io", io);

// Initialize Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = require("./config/db");
connectDB();

// Load Socket Handler
require("./socket/socketHandler")(io); // 👍 Handles real-time events


// Test route
app.get("/", (req, res) => {
  res.send("ERS-2 Backend is running ✅");
});

// API Routes
app.use("/api/emergency", require("./routes/emergencyRoutes"));
app.use("/api/ambulance", require("./routes/ambulanceRoutes"));
app.use("/api/ambulances", require("./routes/ambulanceRoutes")); // Optional: if using both singular/plural
app.use("/api/hospitals", require("./routes/hospitalRoutes"));
app.use("/api/dispatch", require("./routes/dispatchRoutes"));
app.get("/api/dashboard/summary", dashboardController.getFullDashboardSummary);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
