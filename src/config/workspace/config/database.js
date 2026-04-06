"use strict";

// Load environment variables first
require("dotenv").config();

const { Sequelize } = require("sequelize");
const config = require("./index");

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "postgres",
    logging: config.env === "development" ? console.log : false,
  },
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected.");

    if (config.env === "development") {
      await sequelize.sync({ alter: true });
      console.log("Database synced.");
    }
  } catch (err) {
    console.error("Database connection error:", err);
  }
};

module.exports = { sequelize, connectDB };