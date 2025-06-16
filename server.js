require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const interestRoutes = require("./routes/interests");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();

    // Get database status
    const dbStatus = {
      status: "healthy",
      message: "Database connection is established successfully.",
      timestamp: new Date().toISOString(),
    };

    // Get system information
    const systemInfo = {
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
    };

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        system: systemInfo,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: {
          status: "unhealthy",
          message: "Database connection failed",
          error: error.message,
        },
      },
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/interests", interestRoutes);

// Database sync and server start
const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await sequelize.sync();
    console.log("Database connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

startServer();
