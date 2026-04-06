"use strict";

const { Router } = require("express");
// const healthRouter = require("./health");
const usersRouter  = require("./users");

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "BCS Workspace API is running 🚀" });
});

// router.use("/health", healthRouter);
router.use("/users",  usersRouter);

module.exports = router;