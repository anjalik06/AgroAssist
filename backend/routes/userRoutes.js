const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.put("/set-role", authMiddleware, async (req, res) => {

  const { role } = req.body;

  if (!["farmer", "consumer"].includes(role)) {
    return res.status(400).json({ message: "Role must be 'farmer' or 'consumer'" });
  }

  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role && user.role !== "user") {
      return res.status(400).json({ message: "Role already set" });
    }

    user.role = role;
    await user.save();

    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Role set successfully",
      token,
      user
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Failed to set role"
    });

  }

});

router.put("/update-profile", authMiddleware, async (req, res) => {

  const { firstName, lastName, age, address, farmName } = req.body;

  try {

    const updateData = {
      firstName,
      lastName,
      age,
      profileCompleted: true
    };

    if (farmName !== undefined) {
      updateData.farmName = farmName;
    }

    if (address) {
      updateData.address = address;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile updated",
      user
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Profile update failed"
    });

  }

});
router.get("/me", authMiddleware, async (req, res) => {

  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Failed to fetch profile"
    });

  }

});

module.exports = router;