const express = require("express");
const router = express.Router();
const { User, Interest } = require("../models");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const { Op } = require("sequelize");
const { calculateDistance, formatDistance } = require("../config/helper");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Get users within radius and age range
router.get("/nearby", auth, async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser.latitude || !currentUser.longitude) {
      return res
        .status(400)
        .json({ error: "Please set your location preferences first" });
    }

    // Get all users except current user
    const users = await User.findAll({
      where: {
        id: {
          [Op.ne]: currentUser.id,
        },
        latitude: {
          [Op.not]: null,
        },
        longitude: {
          [Op.not]: null,
        },
      },
      attributes: {
        exclude: ["password"],
      },
      include: [{ model: Interest, as: "interests" }],
    });

    // Calculate distances and filter by radius
    const usersWithDistance = users
      .map((user) => {
        const userJson = user.toJSON();
        const distance = calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          user.latitude,
          user.longitude
        );
        return {
          ...userJson,
          distance: formatDistance(distance),
        };
      })
      .filter((user) => user.distance <= currentUser.radius)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      count: usersWithDistance.length,
      radius: currentUser.radius,
      users: usersWithDistance,
    });
  } catch (error) {
    console.error("Error in nearby users route:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get("/", auth, roleAuth(["admin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ["password"] },
      include: [{ model: Interest, as: "interests" }],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      users,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Interest, as: "interests" }],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user preferences
router.patch("/:id/preferences", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.id !== user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { latitude, longitude, radius, minAge, maxAge } = req.body;

    // Validate inputs
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({ error: "Invalid latitude value" });
    }

    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({ error: "Invalid longitude value" });
    }

    if (radius !== undefined && (radius < 1 || radius > 1000)) {
      return res
        .status(400)
        .json({ error: "Radius must be between 1 and 1000 kilometers" });
    }

    if (minAge !== undefined && (minAge < 18 || minAge > 99)) {
      return res
        .status(400)
        .json({ error: "Minimum age must be between 18 and 99" });
    }

    if (maxAge !== undefined && (maxAge < 18 || maxAge > 99)) {
      return res
        .status(400)
        .json({ error: "Maximum age must be between 18 and 99" });
    }

    if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
      return res
        .status(400)
        .json({ error: "Minimum age cannot be greater than maximum age" });
    }

    // Update preferences
    const updates = {
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(radius !== undefined && { radius }),
      ...(minAge !== undefined && { minAge }),
      ...(maxAge !== undefined && { maxAge }),
    };

    await user.update(updates);

    res.json({
      message: "Preferences updated successfully",
      preferences: {
        latitude: user.latitude,
        longitude: user.longitude,
        radius: user.radius,
        minAge: user.minAge,
        maxAge: user.maxAge,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user
router.patch("/:id", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.id !== user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "email"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates" });
    }

    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update password
router.patch("/:id/password", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.user.id !== user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "New password must be different from current password",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({ password: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete("/:id", auth, roleAuth(["admin"]), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({
      where: { email },
      attributes: [
        "id",
        "name",
        "email",
        "password",
        "isAdmin",
        "isVerified",
        "isBlocked",
      ],
      include: [{ model: Interest, as: "interests" }],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "Your account has been blocked. Please contact support.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        interests: user.interests,
      },
    });
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
