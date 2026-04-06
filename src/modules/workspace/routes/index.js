"use strict";

const { Router } = require("express");
const router = Router();

const healthRouter = require("./health");

router.get("/", (_req, res) => {
  res.json({ message: "BCS Tasks API is running 🚀" });
});

router.use("/health", healthRouter);

// Future routes added here as sprints progress
router.use("/auth", require("./auth"));
// router.use("/projects", require("./projects"));
// router.use("/tasks",    require("./tasks"));

module.exports = router;