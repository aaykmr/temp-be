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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/interests", interestRoutes);

// Database sync and server start
const PORT = process.env.PORT || 3000;

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
