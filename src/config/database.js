"use strict";

require("dotenv").config();

const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   String(process.env.DB_PASSWORD || ""), // 🔥 force string
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: "postgres",
//     logging: process.env.NODE_ENV === "development" ? console.log : false,
//   },
// );

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
);

const connectDB = async () => {
  try {
    console.log("🔍 ENV CHECK:");
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD);

    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected.");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("✅ Database synced.");
    }
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1); // 🔥 STOP APP if DB fails
  }
};

module.exports = { sequelize, connectDB };
