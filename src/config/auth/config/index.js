"use strict";

require("dotenv").config();

module.exports = {
  env:  process.env.NODE_ENV || "development",
  port: process.env.PORT     || 3000,

  db: {
    host:     process.env.DB_HOST     || "localhost",
    port:     process.env.DB_PORT     || 5432,
    name:     process.env.DB_NAME     || "mydb",
    user:     process.env.DB_USER     || "postgres",
    password: process.env.DB_PASSWORD || "",
  },
};