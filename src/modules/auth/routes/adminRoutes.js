const express = require("express");
const router = express.Router();

const requireSuperAdmin = require("../../../middleware/auth/middleware/roleMiddleware");

router.get("/admin-only", requireSuperAdmin, (req, res) => {
  res.json({ message: "Welcome Super Admin" });
});

module.exports = router;
