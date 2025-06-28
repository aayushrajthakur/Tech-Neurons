// server.js - ERS-2 Backend Main Entry Point

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIO = require("socket.io");
const dashboardController = require("./controllers/dashboardController");
const startAmbulanceTracking = require("./utils/simulateAmbulanceMovement");
const connectDB = require("./config/db");
const { setSocketInstance } = require("./socket/socketHandler");

dotenv.config(); // Load .env variables

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" },
});

app.set("io", io);

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Routes and Controllers
app.get("/", (req, res) => {
  res.send("ERS-2 Backend is running ✅");
});

app.use("/api/emergency", require("./routes/emergencyRoutes"));
app.use("/api/ambulance", require("./routes/ambulanceRoutes"));
app.use("/api/hospitals", require("./routes/hospitalRoutes"));
app.use("/api/dispatch", require("./routes/dispatchRoutes")); // ✅ Correct dispatch route
app.get("/api/dashboard/summary", dashboardController.getFullDashboardSummary);
app.use("/analyze", require("./routes/analyzeRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Connect to DB and start server after successful connection
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
    setSocketInstance(io); // ✅ Attach Socket.IO
    startAmbulanceTracking(); // ✅ Start movement simulation only after DB is connected

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
