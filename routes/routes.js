const express = require("express");
const path = require("path");

const router = express.Router();



router.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../socket/views/signup.html"));
});



router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../socket/views/login.html"));
});



router.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "../socket/views/chat.html"));
});



module.exports = router;
