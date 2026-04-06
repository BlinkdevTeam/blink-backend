"use strict";

const { Router }      = require("express");
const usersController = require("../controllers/usersController");

const router = Router();

router.get("/",          usersController.getAll);
router.get("/:id",       usersController.getById);
router.post("/",         usersController.create);
router.post("/invite",   usersController.invite); //mailer

module.exports = router;