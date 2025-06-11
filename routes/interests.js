const express = require("express");
const router = express.Router();
const { Interest, User } = require("../models");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");

// Get all interests
router.get("/", auth, async (req, res) => {
  try {
    const interests = await Interest.findAll({
      include: [{ model: User, as: "users" }],
    });
    res.json(interests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create interest (admin only)
router.post("/", auth, roleAuth(["admin"]), async (req, res) => {
  try {
    const interest = await Interest.create(req.body);
    res.status(201).json(interest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update interest (admin only)
router.patch("/:id", auth, roleAuth(["admin"]), async (req, res) => {
  try {
    const interest = await Interest.findByPk(req.params.id);

    if (!interest) {
      return res.status(404).json({ error: "Interest not found" });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "weight"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates" });
    }

    updates.forEach((update) => (interest[update] = req.body[update]));
    await interest.save();

    res.json(interest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete interest (admin only)
router.delete("/:id", auth, roleAuth(["admin"]), async (req, res) => {
  try {
    const interest = await Interest.findByPk(req.params.id);

    if (!interest) {
      return res.status(404).json({ error: "Interest not found" });
    }

    await interest.destroy();
    res.json({ message: "Interest deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
