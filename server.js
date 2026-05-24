const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("./middlewares/chalk");
const path = require("path");
const app = express(); // Initialize app here
const PORT = process.env.PORT || 8000;
// --------------------------------- //

// Build CORS options: origin check + methods/headers/credentials
const corsOptions = {
  // -Change origin * to DOMAIN in production- //
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true, // Allow cookies and credentials to be sent //
};
// Enable CORS middleware
app.use(cors(corsOptions));
// --------------------------------- //
//Middlewares
app.use(logger);
app.use(express.json());
// Serve static files from public folder
app.use(express.static("public"));
//Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/cards", require("./routes/cards"));

// Simple versioned API endpoints (useful for smoke tests)
app.get("/api/v1/users", (req, res) => {
  res.json({ message: "API Users v1" });
});

app.get("/api/v2/users", (req, res) => {
  res.json({ message: "API Users v2" });
});

// Serve frontend build from `dist` when present
const distDir = path.join(process.cwd(), "dist");
app.use(express.static(distDir));

// Fallback to index.html for SPA routes (only when not requesting /api)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

// --------------------------------- //
//Connect to MongoDataBase
mongoose
  .connect(process.env.DB_HOST)
  .then(() => {
    console.log("Connected to DataBase √");
  })
  .catch((err) => {
    console.log("Error connecting to DataBase X");
  });

// Start the server
app.listen(PORT, () => {
  console.log(`BackEnd Server - is running on http://localhost:${PORT}`);
});
