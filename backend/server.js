require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDatabase } = require("./models/initDatabase");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Document Management System API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/users", require("./routes/users"));
// app.use('/api/dashboard', require('./routes/dashboard'));
// app.use('/api/activities', require('./routes/activities'));

// Error handling middleware (will be implemented later)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred",
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database before starting server
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Only start server if not in test mode
if (process.env.NODE_ENV !== "test") {
  startServer();
}

module.exports = app;
