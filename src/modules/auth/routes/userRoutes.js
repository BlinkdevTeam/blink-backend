"use strict";

const express = require("express");
const router = express.Router();

const usersController = require("../controllers/usersController");

router.get("/", usersController.getAll);

router.get("/:id", usersController.getById);

router.post("/", usersController.create);

router.get("/:id/check-super-admin", usersController.checkSuperAdmin);

module.exports = router;
