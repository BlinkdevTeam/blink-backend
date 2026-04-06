"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Log = sequelize.define(
  "Log",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: true, // in case someone tried invalid login
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "login",
    },

    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = Log;
