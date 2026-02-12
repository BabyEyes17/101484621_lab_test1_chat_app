const express = require("express");
const bcrypt = require("bcrypt");

const User = require("../models/User");

const router = express.Router();



router.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing username, email, or password." });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ error: "Username or email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashed });

    return res.status(201).json({
      message: "Signup successful",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});



router.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    return res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});



module.exports = router;
