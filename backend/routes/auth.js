const express = require("express");
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    res.json({ message: "Login route" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
